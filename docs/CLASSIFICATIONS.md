# Classification System

Classifications are **pre-computed and stable**. They are stored on each name object in `data/boys.json` / `data/girls.json` under `classifications.{five_year|recent|historic}` and must not be recomputed as part of the Eleventy build. The site treats them as input data.

The canonical list of classification names and descriptions lives in `data/classification-descriptions.json`. That file is the source of truth for the `/patterns/` overview and every classification detail page.

Three orthogonal dimensions are assigned to every name:

| Dimension | Field | Period | Input data | Current classifier |
|---|---|---|---|---|
| Five-year trend | `classifications.five_year` | 2020–2024 | last 5 entries of `rankFrom1996` / `countFrom1996` | `scripts/add-five-year-classifications.js` (reads `analysis_output/since_2020/features_with_clusters.csv`, column `archetype`) |
| Recent trend | `classifications.recent` | 1996–2024 | full `rankFrom1996` (29 values) | `scripts/add-recent-classifications.js` |
| Historic pattern | `classifications.historic` | 1904–2024 | `rankHistoric` (13 decades) | `scripts/add-historic-classifications.js` |

## Five-year classifications (2020–2024)

Nine labels. Produced by clustering the 5-year rank / count trajectory (see `scripts/timeseries_clustering.py` and the output under `analysis_output/since_2020/`), then mapping each name to its archetype.

| Label | Description |
|---|---|
| Top Tier Stable | Consistently in the top 10–15 across all recent years. Elite names with minimal variation. |
| Steady Performer | Present all five years in top 100 with consistent rankings. |
| Rising Star | Strong upward momentum and significant improvement. |
| New Entrant | First appeared in rankings within the last 3 years. |
| Fading | Significant decline across recent years. |
| Volatile | Unpredictable year-to-year swings, no clear direction. |
| One-Hit Wonder | Brief appearance for only 1–2 years. |
| Dominant Force | In top 10 for most or all recent years. |
| Unknown | Insufficient recent data to determine a trend. |

## Recent classifications (1996–2024)

Fourteen labels. Produced algorithmically from the 29-year rank series (`rankFrom1996`) using thresholds for top-100/200/500 appearances, standard deviation, and first-half vs second-half averages.

| Label | Description |
|---|---|
| Perennial Favorite | Consistently high popularity across decades. |
| Modern Hit | Strong sustained popularity with continued growth. |
| Moderate Classic | Steady popularity across generations, gradual upward trend. |
| Rising Star | Dramatic growth with strong upward momentum. |
| Rapid Riser | Explosive growth from minimal presence. |
| Rising Uncommon | Growing steadily from rare to uncommon. |
| Emerging Rare Names | Slow growth from minimal levels. |
| Fading Mega-Hit | Former blockbuster showing significant decline. |
| Declining Former Favorite | Well-established name on a downward trajectory. |
| Fading Classic | Fell from popular status below 500 average. |
| Declining Uncommon | Approached popularity threshold but declining. |
| Extremely Rare | Very low usage with slight decline. |
| Almost Unique | Minimal usage remaining stable. |
| Uncategorized recent pattern | Does not fit the other patterns. |

## Historic classifications (1904–2024)

Eight labels. Produced from the 13-decade `rankHistoric` array.

| Label | Description |
|---|---|
| Steady Classic | Long-term presence with high rankings. |
| Fallen Classic | Long-term favourite that recently dropped from the rankings. |
| Declining Former Favorite | Worsening rank over time. |
| Recent Entrant | New to top 100, emerged in the 2000s or later. |
| Vintage Revival | 20th-century names that have returned to popularity. |
| Pendulum | Swings in and out of fashion. |
| Lost Generation | Popular in early decades, no longer in top 100. |
| Uncategorized | Does not fit the other patterns. |

## How classifications are consumed

- **Name page** (`src/name-pages.njk`): renders up to three badges. Each links to the corresponding `/classifications/{type}/{slug}/` detail page using the pattern `| lower | replace(' ', '-')` on the classification name.
- **Patterns overview** (`src/classifications.njk`): groups all 31 classifications by type and shows counts and example names.
- **Classification detail** (`src/classification-pages.njk`): paginates over the `classifications` global computed in `.eleventy.js:143`. Each entry bundles `{name, slug, type, period, description, names[], count}`.

## Inputs outside the JSON

Some classifier scripts depend on auxiliary files that also need to survive the refactor if we want to be able to re-run them against fresh data later:

- `analysis_output/since_2020/features_with_clusters.csv` — name→archetype mapping consumed by `add-five-year-classifications.js`.
- `data/classification-descriptions.json` — human-readable descriptions for all 31 labels; rendered in templates.
- `data/recent-classifications.txt` and `data/historic-classifications.txt` — **legacy spec notes from an earlier iteration**. The labels they describe do not match the current production labels in `classification-descriptions.json`. Keep only for reference; do not treat as the source of truth.

## Rule during the refactor

The build pipeline for 2025 data must:

1. Regenerate `rankFrom1996`, `countFrom1996`, `rankHistoric`, enrichment fields (slugs, bullet points, related names, historic profile) from the CSV source.
2. **Preserve** the existing `classifications` values for any name that already has them, rather than recompute. Classifier scripts are re-runnable but should remain opt-in, manual steps — not part of `npm run build`.
