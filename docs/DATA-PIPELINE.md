# Data Pipeline

How `data/boys.json` and `data/girls.json` are produced today, and the state the 2025 refactor needs to replace.

## Current state (what to replace)

The generated JSON files are **committed to the repo** and rebuilt by running a hand-ordered sequence of ~20 scripts. There is no single command to go from source CSVs to name JSON. Scripts mutate the JSON files in place, each adding or overwriting specific fields.

```
data/source/*.csv                         (raw)
        │
        ▼
python scripts/generate_{boys,girls}_json.py
        │
        ▼
data/{boys,girls}.json  ← repeatedly rewritten by the scripts below
        │
        ├── scripts/generate-unique-slugs.js            → uniqueSlug
        ├── scripts/add-historic-profiles.js            → historic-profile
        ├── scripts/add-synonyms.js                     → relatedNames
        ├── scripts/add-related-totals.js               → relatedTotalCountFrom1996
        ├── scripts/add-related-ranks.js                → relatedNamesWithRank
        ├── scripts/add-all-bullet-points.js            → bulletPoint1..4
        ├── scripts/add-five-year-classifications.js    → classifications.five_year
        ├── scripts/add-recent-classifications.js       → classifications.recent
        ├── scripts/add-historic-classifications.js     → classifications.historic
        └── scripts/refine-historic-classifications.js  → patches classifications.historic
```

At build time, `.eleventy.js` reads the resulting JSON, appends `gender: "Boy"|"Girl"`, builds a name→full-record map, and enriches every `relatedNamesWithRank` entry with `count` and `uniqueSlug`.

## Source data

Location: `data/source/`.

| File | Shape | Notes |
|---|---|---|
| `Boys-from-1996.csv` | One row per name. Columns: `Name`, then `<year> Rank`, `<year> Count` for each year 1996–2024 (newest first). | Unranked cells are `[x]`. Counts use thousands separators. UTF-8 BOM. |
| `Girls-from-1996.csv` | Same shape. | |
| `Boys-Historic-Top-100.csv` | One row per rank position (1–100). Columns: `Rank`, `1904`, `1914`, `1924`, …, `2024`. | 13 decade columns (not 12). Cells are names (may have trailing whitespace). |
| `Girls-Historic-Top-100.csv` | Same shape. | |

Year columns are hardcoded in `scripts/generate_boys_json.py:48` (`range(1996, 2025)`). Any 2025 refactor should derive the year set from the CSV header instead of hardcoding it.

## Per-name schema

Verified from the first record of `data/boys.json`. Ordering shown is the order the fields currently appear; not all names have every field.

| Field | Type | Origin |
|---|---|---|
| `name` | string | source CSV |
| `rank` | number \| null | latest year rank from `Boys-from-1996.csv` |
| `count` | number \| null | latest year count |
| `rankFrom1996` | `string[29]` | one per year 1996–2024, `"x"` when unranked |
| `countFrom1996` | `string[29]` | one per year 1996–2024, `"x"` when absent |
| `rankHistoric` | `string[13]` | one per decade 1904–2024, `"x"` when unranked |
| `uniqueSlug` | string | `scripts/generate-unique-slugs.js`; disambiguates collisions with `-1`, `-2` suffixes |
| `historic-profile` | object | `scripts/add-historic-profiles.js` — four era buckets (`1-early-century`, `2-mid-century`, `3-end-century`, `4-recent`), each `{best-rank, best-decade, popularity: 0–5}` |
| `relatedNames` | `string[]` | `scripts/add-synonyms.js` from `data/synonyms.txt` (file not currently present in repo for all names) |
| `relatedTotalCountFrom1996` | `string[29]` | `scripts/add-related-totals.js` — combined count across variants |
| `relatedNamesWithRank` | `{name, rank, gender?}[]` | `scripts/add-related-ranks.js`; Eleventy later enriches with `count` and `uniqueSlug` |
| `bulletPoint1`..`bulletPoint4` | string | `scripts/add-bullet-point-*.js` (orchestrated by `add-all-bullet-points.js`) |
| `classifications` | `{five_year, recent, historic}` | three classifier scripts, see [docs/CLASSIFICATIONS.md](./CLASSIFICATIONS.md) |
| `gender` | `"Boy" \| "Girl"` | injected at build time in `.eleventy.js:61` (not persisted on disk) |

No `tags` field is present in production JSON despite the existence of `scripts/add-tags.js`. That script appears to be dead code from an earlier iteration.

## Script inventory

### Source → JSON
- `scripts/generate_boys_json.py` — CSV → initial `boys.json`. Produces `name`, `rank`, `count`, `rankFrom1996`, `countFrom1996`, `rankHistoric`.
- `scripts/generate_girls_json.py` — same for girls.

### Slugs and enrichment (must run in roughly this order after generation)
- `scripts/generate-unique-slugs.js` — adds `uniqueSlug`.
- `scripts/add-historic-profiles.js` — adds `historic-profile`.
- `scripts/add-synonyms.js` — adds `relatedNames` from `data/synonyms.txt`.
- `scripts/add-related-totals.js` — adds `relatedTotalCountFrom1996`.
- `scripts/add-related-ranks.js` — adds `relatedNamesWithRank`.
- `scripts/add-bullet-point-1.js` through `scripts/add-bullet-point-4.js` — individual narrative generators.
- `scripts/add-all-bullet-points.js` — runs all four in sequence.

### Classification assignment
- `scripts/add-five-year-classifications.js` — reads `analysis_output/since_2020/features_with_clusters.csv`.
- `scripts/add-recent-classifications.js` — algorithmic from `rankFrom1996`.
- `scripts/add-historic-classifications.js` — algorithmic from `rankHistoric`.
- `scripts/refine-historic-classifications.js` — post-processes historic labels.
- `scripts/reorganize-classifications.js` — one-off structural migration.
- `scripts/update-cluster-classifications.js` — syncs from cluster analysis.
- `scripts/update-historic-classifications-from-archetypes.js` — syncs historic from archetype CSV.

### Offline analysis (output → `analysis_output/`, not consumed by the site at build time apart from `features_with_clusters.csv`)
- `scripts/analyze_all_ranks.py`
- `scripts/analyze_recent_5yr.py`
- `scripts/analyze_historic_features.py`
- `scripts/analyze_name_features.py`
- `scripts/analyze_unpopular_names.py`
- `scripts/timeseries_clustering.py`

### Intermediate CSV extractors (outputs live in `data/`, not consumed by Eleventy)
- `scripts/create-all-ranks-csv.js` → `data/all_ranks.csv`
- `scripts/extract-count-timeseries.js` → `data/countTimeSeries.csv`
- `scripts/extract-rank-historic-timeseries.js` → `data/rankHistoricTimeSeries.csv`

### Dev utility
- `scripts/create-dev-data.js` — writes `data/boys-dev.json` / `data/girls-dev.json` with the top 500 names from each gender for fast dev builds.

## Build-time data loading

`.eleventy.js` exposes three global data values:

- `allNames` (`.eleventy.js:51`) — concatenated boys + girls JSON, with `gender` injected and `relatedNamesWithRank` enriched with `count` / `uniqueSlug` from a cross-gender lookup map.
- `classifications` (`.eleventy.js:143`) — derived grouping, one entry per unique classification across all three dimensions, bundling description (from `classification-descriptions.json`), period label, and matching names.
- `classificationDescriptions`, `siteConfig`, `names` — supporting globals.

After build, an `eleventy.after` hook writes `_site/search-index.json` with `{name, slug, gender, rank}` for every name.

## Auxiliary data files

| File | Role | Keep? |
|---|---|---|
| `data/classification-descriptions.json` | Human descriptions rendered on the site | **Keep** — source of truth for classification labels. |
| `data/synonyms.txt` (referenced by `add-synonyms.js`) | Name-variant groupings for `relatedNames` | **Keep** if present, otherwise source/recreate before running related-names enrichment. |
| `data/bullet-points.md`, `data/bullet-points.txt` | Template logic notes for bullet-point generation | Reference only. |
| `data/recent-classifications.txt`, `data/historic-classifications.txt` | **Out-of-date spec** that does not match current production labels | Keep for historical context; do not treat as truth. |
| `data/all_ranks.csv`, `data/countTimeSeries*.csv`, `data/rankHistoricTimeSeries.csv` | Intermediate analytics CSVs | Regenerable — can be dropped. |
| `data/cluster_centroids.png`, `data/silhouette_scores.png` | Clustering analysis plots | Move to `analysis_output/` or drop. |
| `data/*.bak` | Stale backups | Drop. |
| `analysis_output/since_2020/features_with_clusters.csv` | **Input** to `add-five-year-classifications.js` | **Keep**. |
| Other files in `analysis_output/` | Reports from the one-off Python analyses | Keep as reference; not in the build path. |

## What the refactored pipeline needs to do

Goals for the 2025 rebuild, captured here so the scope is explicit before any code is deleted:

1. **One entry point.** A single `npm run build:data` that goes from `data/source/*.csv` → `data/boys.json` + `data/girls.json`, with steps expressed in code (not a README checklist).
2. **Year-agnostic.** Drive the year set from the CSV headers, not a hardcoded `range(1996, 2025)`.
3. **Regenerate everything regeneratable.** Slugs, historic profile, related names, related totals, bullet points — all part of the pipeline.
4. **Preserve classifications.** Carry forward existing `classifications.{five_year,recent,historic}` values from the previous JSON build (or a snapshot file) rather than recompute. Classifier scripts remain available as separate, manual tools for when classifications need a refresh.
5. **Generated JSON should be buildable on demand.** The committed `boys.json` / `girls.json` can eventually be removed from the repo once the pipeline is reliable; until then they stay so Netlify keeps building.
6. **Dev and prod parity.** `create-dev-data.js` keeps working (subset of the same shape) or gets folded into the pipeline.

See `docs/FEATURES.md` for the site surface that must remain intact, and `docs/CLASSIFICATIONS.md` for the classifier contract that must be preserved.
