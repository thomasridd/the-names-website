# CLAUDE.md - AI Assistant Guide for the-names-website

**Last Updated:** April 26, 2026
**Project:** the-names-website
**Description:** A website for thinking about names
**Owner:** thomasridd

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Current Project State](#current-project-state)
3. [Repository Structure](#repository-structure)
4. [Data Sources](#data-sources)
5. [Classification System](#classification-system)
6. [Development Workflows](#development-workflows)
7. [Key Conventions](#key-conventions)
8. [Technology Stack](#technology-stack)
9. [Common Tasks](#common-tasks)
10. [Git Workflow](#git-workflow)
11. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

### Purpose
The-names-website is a **static website generator** for exploring 120+ years of baby name trends (1904–2024) across 40,000+ names. It:
- Generates thousands of individual name pages from JSON data sources
- Classifies names by popularity trend patterns (three classification dimensions)
- Provides browsable classification pages, analysis pages, and a fuzzy search
- Outputs a fully static website optimised for Netlify deployment

### Project Type
**Static Site Generator (SSG)** — Data-driven static website with:
- JSON-based page generation (one page per name)
- Template-based rendering with Nunjucks
- Classification system (three dimensions: five-year, recent, historic)
- Clean URL structure with unique slugs
- Thousands of generated pages including analyses and experiments

### Current Status
**PRODUCTION READY** — Full-featured static site with:
- Production name data (~40,000 boys' and girls' names)
- Three-dimensional classification system (five_year, recent, historic)
- Fuzzy client-side search (Fuse.js + pre-built search index)
- Netlify deployment configured (netlify.toml)
- Analysis pages: clusters, faded names, heatmaps, rank-count tables
- Responsive Tailwind CSS design with D3.js chart visualisations

---

## Current Project State

### What Exists

#### Core Infrastructure
- Git repository with Netlify CI/CD (`netlify.toml`)
- 11ty static site generator (`.eleventy.js`, 1,100+ lines)
- Tailwind CSS v4 with PostCSS build pipeline
- npm scripts for development and production builds
- `.gitignore` excluding `_site/`, `node_modules/`, and dev data files

#### Data
- Production JSON: `data/boys.json` and `data/girls.json` (~18.7 MB total, ~40,000 names)
- Dev JSON: `data/boys-dev.json` and `data/girls-dev.json` (top 500 each — gitignored)
- `data/classification-descriptions.json` — human-readable labels for all classifications
- `data/source/` — raw CSV files (source of truth for name rankings)
- `data/all_ranks.csv`, `data/countTimeSeries.csv`, `data/rankHistoricTimeSeries.csv` — intermediate analytics CSVs
- `analysis_output/` — pre-computed clustering results consumed by `add-five-year-classifications.js`

#### Templates & Pages
- `src/templates/base.njk` — master HTML layout with header nav and embedded Fuse.js search
- `src/index.njk` — homepage with classification showcases and featured name journeys
- `src/names.njk` — all names listing
- `src/name-pages.njk` — individual name pages (thousands generated via 11ty pagination)
- `src/classifications.njk` — classification overview page
- `src/classification-pages.njk` — individual classification pages
- `src/top-100.njk` — current top-100 names page
- `src/analyses.njk` — analyses hub page
- `src/analyses-clusters.njk` — historic cluster visualisation
- `src/analyses-faded-names.njk` — faded names analysis
- `src/analyses-heatmap.njk` — historic presence heatmap
- `src/analyses-labelled-clusters.njk` — labelled cluster breakdown
- `src/analyses-rank-counts.njk` — rank vs baby count analysis tables
- `src/experiments.njk` — experimental clustering approaches hub
- `src/experiment-index-pages.njk` — individual experiment pages

#### Scripts
**Data Generation:**
- `scripts/generate_boys_json.py`, `scripts/generate_girls_json.py` — CSV → initial JSON
- `scripts/create-dev-data.js` — generates top-500 dev subset

**Enrichment (run in order after generation):**
- `scripts/generate-unique-slugs.js` → `uniqueSlug`
- `scripts/add-historic-profiles.js` → `historic-profile`
- `scripts/add-synonyms.js` → `relatedNames`
- `scripts/add-related-totals.js` → `relatedTotalCountFrom1996`
- `scripts/add-related-ranks.js` → `relatedNamesWithRank`
- `scripts/add-all-bullet-points.js` (orchestrates `add-bullet-point-1.js` through `add-bullet-point-4.js`) → `bulletPoint1`–`bulletPoint4`

**Classification Assignment:**
- `scripts/add-five-year-classifications.js` → `classifications.five_year` (reads `analysis_output/since_2020/features_with_clusters.csv`)
- `scripts/add-recent-classifications.js` → `classifications.recent`
- `scripts/add-historic-classifications.js` → `classifications.historic`
- `scripts/refine-historic-classifications.js` — post-processes historic labels
- `scripts/reorganize-classifications.js` — one-off structural migration (dead code, do not re-run)
- `scripts/update-cluster-classifications.js` — syncs from cluster analysis output
- `scripts/update-historic-classifications-from-archetypes.js` — syncs from archetype CSV

**Analysis (Python, output goes to `analysis_output/`):**
- `scripts/analyze_all_ranks.py`, `scripts/analyze_recent_5yr.py`, `scripts/analyze_historic_features.py`
- `scripts/analyze_name_features.py`, `scripts/analyze_unpopular_names.py`, `scripts/timeseries_clustering.py`

**Intermediate CSV Extractors:**
- `scripts/create-all-ranks-csv.js`, `scripts/extract-count-timeseries.js`, `scripts/extract-rank-historic-timeseries.js`

#### Features
- Clean URL structure: `/names/boy/unique-slug/` and `/names/girl/unique-slug/`
- Gender-separated name organisation
- D3.js charts for historic (decade-by-decade) and modern (1996–2024) rankings
- Tabbed chart/data-table view on name pages
- Classification badges with links on name pages
- Fuzzy search via Fuse.js (threshold 0.3, 10 results, keyboard-navigable)
- Search index generated at build time: `_site/search-index.json`
- Related names section with current ranks
- Four narrative bullet points per name
- Analysis pages: clusters, heatmaps, faded names, rank-count analysis

### What Doesn't Exist Yet
- Single `npm run build:data` command (pipeline is a hand-ordered sequence of scripts — see `docs/DATA-PIPELINE.md`)
- Year-agnostic CSV parsing (year range is hardcoded as `range(1996, 2025)` in Python scripts)
- CI/CD for data regeneration (Netlify builds the site; data must be updated manually)

---

## Repository Structure

```
the-names-website/
├── .git/
├── .claude/
│   └── settings.local.json          # Claude Code permissions allowlist
├── data/
│   ├── boys.json                    # ~9.3 MB production data
│   ├── girls.json                   # ~9.4 MB production data
│   ├── boys-dev.json                # top-500 subset (gitignored, generated)
│   ├── girls-dev.json               # top-500 subset (gitignored, generated)
│   ├── classification-descriptions.json
│   ├── names.csv                    # small sample for homepage fallback
│   ├── all_ranks.csv                # intermediate analytics
│   ├── countTimeSeries.csv
│   ├── rankHistoricTimeSeries.csv
│   └── source/                      # raw source CSVs
│       ├── Boys-from-1996.csv
│       ├── Girls-from-1996.csv
│       ├── Boys-Historic-Top-100.csv
│       └── Girls-Historic-Top-100.csv
├── scripts/                         # data processing and analysis scripts
├── src/
│   ├── templates/
│   │   └── base.njk                 # master layout (nav, search, footer)
│   ├── styles/
│   │   └── main.css                 # Tailwind CSS entry point
│   ├── scripts/
│   │   └── search.js                # Fuse.js client-side search (161 lines)
│   ├── index.njk
│   ├── names.njk
│   ├── name-pages.njk
│   ├── classifications.njk
│   ├── classification-pages.njk
│   ├── top-100.njk
│   ├── analyses.njk
│   ├── analyses-clusters.njk
│   ├── analyses-faded-names.njk
│   ├── analyses-heatmap.njk
│   ├── analyses-labelled-clusters.njk
│   ├── analyses-rank-counts.njk
│   ├── experiments.njk
│   └── experiment-index-pages.njk
├── docs/
│   ├── CLASSIFICATIONS.md           # classifier contract and label definitions
│   ├── DATA-PIPELINE.md             # full data pipeline documentation
│   ├── FEATURES.md                  # site surface contract
│   └── README.md
├── analysis_output/                 # pre-computed clustering results
│   ├── since_2020/
│   │   └── features_with_clusters.csv  # INPUT to add-five-year-classifications.js
│   ├── all_ranks/
│   ├── historic/
│   ├── popular_names_500/
│   └── unpopular_names_below_500/
├── experiment-data/                 # alternative clustering experiments
├── _site/                           # generated output (gitignored)
├── .eleventy.js                     # 11ty configuration (~1,100 lines)
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── netlify.toml                     # Netlify deployment config
├── README.md
└── CLAUDE.md                        # this file
```

---

## Data Sources

### Per-Name JSON Schema

Each entry in `data/boys.json` and `data/girls.json` contains:

```json
{
  "name": "Muhammad",
  "rank": 1,
  "count": 5721,
  "rankFrom1996": ["108", "95", ..., "1"],     // 29 values (1996–2024), "x" = unranked
  "countFrom1996": ["441", "552", ..., "5721"], // 29 values (1996–2024)
  "rankHistoric": ["x", "x", ..., "51", "14", "1"], // 13 values (1910s–2020s per decade)
  "uniqueSlug": "muhammad",
  "historic-profile": {
    "1-early-century": { "best-rank": null, "best-decade": null, "popularity": 0 },
    "2-mid-century":   { "best-rank": null, "best-decade": null, "popularity": 0 },
    "3-end-century":   { "best-rank": null, "best-decade": null, "popularity": 0 },
    "4-recent":        { "best-rank": 1, "best-decade": "2020s", "popularity": 5 }
  },
  "relatedNames": ["Mohamed", "Mohammed", ...],
  "relatedTotalCountFrom1996": ["3092", ..., "3481"],
  "relatedNamesWithRank": [
    { "name": "Mohammed", "rank": 21, "gender": "Boy" }
  ],
  "bulletPoint1": "In 2024 5,721 boy babies were named Muhammad...",
  "bulletPoint2": "Since 2020 Muhammad has rapidly gained popularity...",
  "bulletPoint3": "Over the past 20 years Muhammad dropped to #52...",
  "bulletPoint4": "Historically Muhammad has only made it to the top 100 list...",
  "classifications": {
    "five_year": "Top Tier Stable",
    "recent":    "Modern Hit",
    "historic":  "Recent Entrant"
  }
}
```

**Important:** The `gender` field (`"Boy"` or `"Girl"`) is **not stored on disk** — it is injected by `.eleventy.js` at build time. `relatedNamesWithRank` is also enriched at build time with `count` and `uniqueSlug` from a cross-gender lookup map.

### Source CSVs

Located in `data/source/`:
- `Boys-from-1996.csv` / `Girls-from-1996.csv` — yearly rank and count per name (1996–2024)
- `Boys-Historic-Top-100.csv` / `Girls-Historic-Top-100.csv` — top-100 per decade (13 decade columns, 1904–2024)

### Classification Descriptions

`data/classification-descriptions.json` — human-readable descriptions keyed by `{five_year, recent, historic}` → classification name. This is the source of truth for classification labels displayed on the site.

---

## Classification System

Names are classified along **three independent dimensions**:

### 1. Five-Year Classifications (2020–2024)
Derived from `analysis_output/since_2020/features_with_clusters.csv` (pre-computed Python clustering). Added by `scripts/add-five-year-classifications.js`.

Examples: `Top Tier Stable`, `Rapid Climber`, `Stable Mid-Tier`, `Declining`, etc.

### 2. Recent Classifications (1996–2024)
Algorithmic, from `rankFrom1996` (29 yearly ranks). Added by `scripts/add-recent-classifications.js`.

Examples: `Modern Hit`, `Timeless`, `Steady Classic`, `Shooting Star`, `Vintage Revival`, `Uncategorized`, etc.

### 3. Historic Classifications (1904–2024)
Algorithmic, from `rankHistoric` (13 decade ranks). Added by `scripts/add-historic-classifications.js`, refined by `scripts/refine-historic-classifications.js`.

Examples: `Century Classic`, `Recent Entrant`, `Lost Generation`, `Pendulum`, `Steady Rise`, `Uncategorized`, etc.

**For full label definitions and classification logic, see `docs/CLASSIFICATIONS.md`.**

### Classification Pages

Each classification generates a page at:
- `/classifications/five_year/{slug}/` — 2020–2024 trends
- `/classifications/recent/{slug}/` — 1996–2024 trends
- `/classifications/historic/{slug}/` — 1904–2024 historic patterns

Pages show the classification description, time period, and all matching names separated by gender.

---

## Development Workflows

### Data Mode Selection

**Branch-based auto-detection** (`.eleventy.js:9–26`):
- On branch `main` → uses `boys.json` / `girls.json` (full ~40,000 names)
- On any other branch → uses `boys-dev.json` / `girls-dev.json` (top 500 names)
- Override with `USE_DEV_DATA=true|false` environment variable

**Production build on Netlify** (via `netlify.toml`):
- Main branch deploys: `npm run build` with `USE_DEV_DATA=false`
- Deploy previews and branch deploys: `npm run dev:data && npm run build` with `USE_DEV_DATA=true`

### Feature Development Workflow

1. **Understand Requirements** — read the request; check `docs/` for relevant contracts
2. **Read Before Writing** — read affected files before modifying; understand existing patterns
3. **Implement Changes** — follow established patterns; keep templates focused
4. **Test with Dev Data** — use `npm run build:dev` or `npm run dev`; check `_site/` output
5. **Commit and Push** — clear commit message; push to feature branch

### Data Processing Workflow

When updating or regenerating production data, run scripts in this order:

```bash
# 1. Generate base JSON from source CSVs
python scripts/generate_boys_json.py
python scripts/generate_girls_json.py

# 2. Enrichment (order matters)
node scripts/generate-unique-slugs.js
node scripts/add-historic-profiles.js
node scripts/add-synonyms.js
node scripts/add-related-totals.js
node scripts/add-related-ranks.js
node scripts/add-all-bullet-points.js

# 3. Classification assignment
node scripts/add-five-year-classifications.js  # requires analysis_output/since_2020/features_with_clusters.csv
node scripts/add-recent-classifications.js
node scripts/add-historic-classifications.js
node scripts/refine-historic-classifications.js

# 4. Build and verify
npm run build:dev
```

**Do not re-run** `scripts/reorganize-classifications.js` — it was a one-off structural migration.

---

## Key Conventions

### Code Style

- **Simplicity over complexity** — don't over-engineer
- **Consistency** — follow established patterns
- **No unnecessary comments** — only comment non-obvious WHY, not WHAT
- **No extra abstractions** — three similar lines beats a premature helper

### File Naming
- kebab-case for all files: `name-pages.njk`, `add-recent-classifications.js`
- Templates: `.njk` extension
- Node.js scripts: `.js`
- Python scripts: `.py`

### Template Guidelines
- Keep templates single-purpose
- Complex logic belongs in `.eleventy.js` or scripts, not templates
- Use `{{ nameData.classifications.recent }}`, `{{ nameData.classifications.historic }}`, `{{ nameData.classifications.five_year }}` — **not** the old `recentClassification` / `historicClassification` fields

### Data Conventions
- Never manually create slugs — always use `scripts/generate-unique-slugs.js`
- Never commit `data/boys-dev.json` or `data/girls-dev.json` — they are gitignored
- `gender` is added by `.eleventy.js` at build time; it is not in the JSON files on disk
- `classifications` is an object `{five_year, recent, historic}` — not three top-level fields

### Security
- Never commit secrets, API keys, or credentials
- Validate data structure at system boundaries (file reading, CSV parsing)
- Template XSS: Nunjucks auto-escapes by default; use `| safe` only for trusted content

---

## Technology Stack

**SSG:** 11ty (Eleventy) v3.1.2
**Templates:** Nunjucks
**Data Format:** JSON (from CSV source files)
**Styling:** Tailwind CSS v4.1.17 with PostCSS + autoprefixer
**Charts:** D3.js (loaded via CDN in templates)
**Search:** Fuse.js v7.1.0 (client-side fuzzy search, search index generated at build time)
**Build Tools:** npm-run-all for parallel builds
**Deployment:** Netlify (netlify.toml configured)
**Data Processing:** Node.js + Python 3

### Key Dependencies

```json
{
  "dependencies": {
    "fuse.js": "^7.1.0"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.1.2",
    "@tailwindcss/postcss": "^4.1.17",
    "autoprefixer": "^10.4.22",
    "csv-parse": "^6.1.0",
    "npm-run-all": "^4.1.5",
    "postcss": "^8.5.6",
    "postcss-cli": "^11.0.1",
    "tailwindcss": "^4.1.17"
  }
}
```

---

## Common Tasks

### Development Server (Dev Data)

```bash
npm run dev
```

This:
1. Regenerates dev data (`scripts/create-dev-data.js` → `data/boys-dev.json` + `data/girls-dev.json`)
2. Builds CSS once
3. Starts 11ty dev server with live reload (watching for changes)
4. Runs CSS watch in parallel

**Always use this for development** — production data requires 8 GB heap and takes minutes.

### Build with Dev Data

```bash
npm run build:dev
```

Equivalent to `USE_DEV_DATA=true npm run build`. Use to verify a full build quickly.

### Build for Production

```bash
npm run build:prod
# or
npm run build   # on main branch, auto-detects as production
```

Uses full dataset. Requires significant memory (8 GB heap configured in `package.json`).

### Regenerate Dev Data Only

```bash
npm run dev:data
```

Runs `scripts/create-dev-data.js` to generate `data/boys-dev.json` and `data/girls-dev.json`.

### Verify Build Output

```bash
ls _site/
ls _site/names/boy/
ls _site/classifications/recent/
ls _site/classifications/historic/
ls _site/classifications/five_year/
ls _site/analyses/
```

### Process Data (Full Pipeline)

See the Data Processing Workflow section above. Refer to `docs/DATA-PIPELINE.md` for the full schema and script inventory.

### Preview Production Build

```bash
npx serve _site
# Visit http://localhost:3000
```

---

## Git Workflow

### Branch Strategy

All development happens on feature branches:
- Branch naming: `claude/<feature-name>-<session-id>` or `claude/claude-md-<session-id>`
- Never push directly to `main`
- Create pull requests for code review

### Commit Message Format

```
<type>: <concise description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `data`, `chore`, `perf`

### Pushing Changes

```bash
git push -u origin <branch-name>
```

On network failure, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s).

---

## AI Assistant Guidelines

### Always

1. **Read before writing** — never modify code you haven't read
2. **Use dev data for testing** — `npm run build:dev` or `npm run dev`; never test with production data unless specifically required
3. **Preserve the data schema** — fields like `classifications` (object), `uniqueSlug`, `historic-profile` have specific shapes; check `docs/DATA-PIPELINE.md` before modifying data scripts
4. **Check `docs/` first** — `CLASSIFICATIONS.md`, `DATA-PIPELINE.md`, and `FEATURES.md` contain contracts that must be preserved
5. **Test the golden path** — after template changes, verify an individual name page, a classification page, and the homepage all render correctly

### Working with Large Data Files

- `boys.json` and `girls.json` are ~9 MB each — use `offset`/`limit` when reading; don't load entire files
- Use `grep` for searching inside large JSON files
- Data files are version-controlled despite their size

### Working with Classifications

- **Three dimensions**: `classifications.five_year`, `classifications.recent`, `classifications.historic`
- `five_year` comes from pre-computed CSV (`analysis_output/since_2020/features_with_clusters.csv`) — re-running requires re-running the Python analysis first
- `recent` and `historic` are algorithmic from ranking arrays — scripts can be re-run independently
- `classification-descriptions.json` is the source of truth for human-readable labels

### Common Pitfalls

- **Memory errors** = you're probably building with production data; switch to `npm run build:dev`
- **Missing `gender` field in JSON** = normal; it's injected at build time by `.eleventy.js`
- **`classifications` as separate fields** = old schema; current schema uses `classifications: {five_year, recent, historic}`
- **`dev:fast` script** = does not exist; use `npm run dev` instead
- **Manually creating slugs** = never do this; always run `scripts/generate-unique-slugs.js`

### Before Completing Tasks

- All requested changes implemented
- Code follows project conventions
- No security vulnerabilities introduced
- Tested with dev data (`npm run build:dev` or `npm run dev`)
- Build completes without errors
- Generated pages look correct in `_site/`
- Classification and name page links work
- Data structure preserved (check `docs/DATA-PIPELINE.md` schema)
- Changes committed with clear message
- Pushed to correct feature branch

---

## Documentation in `docs/`

Refer to these files for deeper detail:

| File | Purpose |
|---|---|
| `docs/CLASSIFICATIONS.md` | Classifier contract: label definitions, logic, what must be preserved |
| `docs/DATA-PIPELINE.md` | Full schema per-field, script inventory, build-time loading, known issues |
| `docs/FEATURES.md` | Site surface contract: what pages and features must remain intact |

---

## Maintenance

### Updating This Document

Update CLAUDE.md when:
- New page types are added
- Data schema changes (fields added/removed/renamed)
- Build processes change
- New scripts are added or old ones deprecated
- Classification system is modified
- Deployment configuration changes

### Version History

- **v3.0** — April 26, 2026 — Full rewrite: three-dimensional classification system, Fuse.js search, analysis pages, Netlify deployment, complete script inventory, updated data schema, branch-based data auto-detection
- **v2.1** — December 12, 2025 — Added dev data testing guidelines, increased heap memory to 8 GB, added related names hyperlinks and gender indicators
- **v2.0** — December 8, 2025 — Complete refresh: production data, classification system, unique slugs, thousands of pages
- **v1.3** — December 7, 2025 — Integrated Tailwind CSS v4 with PostCSS build pipeline
- **v1.2** — December 7, 2025 — Updated with selected technology stack (11ty + Nunjucks + csv-parse)
- **v1.1** — December 7, 2025 — Updated with SSG-specific guidance, CSV data handling, and search functionality
- **v1.0** — December 7, 2025 — Initial creation
