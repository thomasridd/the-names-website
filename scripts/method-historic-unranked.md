# Method: Historic Unranked Clustering

Reference specification for reproducing **Method 5** from `/analyses/faded-names/` — the hybrid method that combines two priority rules with k-means in a 5-feature space to partition historic top-100 names that are no longer ranked in 2024.

## Purpose

Partition every name that has ever reached the top 100 but is unranked in 2024 into five named categories based on its decade-by-decade trajectory:

- **Past classics** — consistently popular for decades, now fallen out of the top 100
- **Golden generation** — only popular in the first decades of the twentieth century
- **Past stars** — a short spell in the top 100; now gone
- **Of a time** — several consecutive decades in the top 100
- **Past revival** — popular early, came back for a revival, out of favour now

## Inputs

Two JSON files: `boys.json`, `girls.json` (or their `-dev` variants). Each record is expected to carry at least:

| field | type | description |
|---|---|---|
| `name` | string | display name |
| `rankHistoric` | string[13] | rank per decade, 1904 → 2024 in 10-year steps; numeric string (always ≤100) or `"x"` if outside the top 100 |
| `uniqueSlug` | string | URL slug (optional, for linking out) |

The 13 decade labels are: `1904, 1914, 1924, 1934, 1944, 1954, 1964, 1974, 1984, 1994, 2004, 2014, 2024`.

## Step 1 — Filter

Keep only names that:

1. Have `rankHistoric` of length 13.
2. Are **unranked in 2024**: `rankHistoric[12] === 'x'`.
3. Have **at least one** historic decade in the top 100: some `rankHistoric[i]` parses to an integer in `[1, 100]`.

Combine boys and girls into a single dataset; retain `gender` as metadata.

## Step 2 — Featurise

For each name, parse `rankHistoric` into 13 numeric ranks (`null` for `"x"`), then derive:

```
bin100[i] = 1 if rank[i] in [1,100] else 0
```

From `bin100` compute five summary features:

| # | feature | definition |
|---|---|---|
| f1 | `sumTop100` | count of decades where `bin100 == 1` |
| f2 | `firstTop100` | index of first `bin100 == 1` (`-1` if none, but filter guarantees ≥1) |
| f3 | `lastTop100` | index of last `bin100 == 1` (`-1` if none) |
| f4 | `longestGap` | longest run of `bin100 == 0` strictly between the first and last `1` (0 if fewer than 2 top-100 decades) |
| f5 | `span` | `lastTop100 − firstTop100` (0 if first/last undefined) |

Normalise into a 5-vector in `[0, 1]⁵`:

```
feature[0] = sumTop100   / 12
feature[1] = firstTop100 / 11   (use 11 if firstTop100 == -1)
feature[2] = lastTop100  / 11   (use 0  if lastTop100  == -1)
feature[3] = longestGap  / 12
feature[4] = span        / 11
```

## Step 3 — Priority rules

Two hard rules are evaluated first, in order. If a rule fires the name is assigned directly to the rule's label and skips k-means.

```
Rule 1 — Golden generation
  if bin100[4..12] are all 0         (no top-100 decade from 1944 onwards)
  → assign "Golden generation"

Rule 2 — Past stars
  if sumTop100 == 1                  (single top-100 decade)
  → assign "Past stars"
  if sumTop100 == 2 and
     lastTop100 - firstTop100 == 1   (two consecutive top-100 decades)
  → assign "Past stars"
```

All remaining names fall through to the clustering step.

## Step 4 — Initial centroids for the remainder

Seed k-means (`k = 3`) with three labelled centroids — one per remaining category:

```
Past classics   [0.70, 0.00, 0.85, 0.10, 0.80]
Of a time       [0.30, 0.35, 0.60, 0.00, 0.30]
Past revival    [0.55, 0.05, 0.90, 0.40, 0.85]
```

The ordering is fixed so that cluster `i` always refers to the same label after iteration. Because the clusters are label-seeded rather than randomly initialised, the output is deterministic and each converged cluster retains its intended semantic label.

## Step 5 — K-means iteration

Run Lloyd's algorithm on the **remaining** feature vectors only, with squared Euclidean distance and up to 100 iterations:

```
repeat up to 100 times:
  for each remaining point:
    assign to nearest centroid by squared Euclidean distance
  if no assignments changed (after iter 0): break
  for each cluster c in {Past classics, Of a time, Past revival}:
    if non-empty: centroid[c] = mean of member feature vectors
    if empty:     leave centroid unchanged
```

Empty clusters are left at their previous centroid (do **not** reseed). Ties on distance go to the lower-index centroid (i.e. the order listed above).

## Step 6 — Output

Each name's final label is either the rule-assigned label from Step 3 or the k-means cluster label from Step 5. Within each of the five clusters, sort members by first top-100 decade ascending, then last top-100 decade ascending, then alphabetically by name.

A convenient rendering is a centroid strip per cluster (each decade shaded by that cluster's share of top-100 presence in `bin100`) followed by a per-name heatmap using a ternary encoding (top 30 / 31–100 / outside top 100).

## Reference implementation

A working JavaScript implementation lives in `.eleventy.js` under the `fadedNames` global data function (the `Method E` / `Method 5` block). A from-scratch script should reproduce the same assignments given the same input JSON.

## Example cluster sizes (dev data, 171 filtered names)

| label | count | source |
|---|---|---|
| Golden generation | 21 | Rule 1 |
| Past stars | 53 | Rule 2 |
| Past classics | 40 | k-means |
| Of a time | 41 | k-means |
| Past revival | 16 | k-means |

These numbers are expected to change on the full dataset but the partition shape should remain stable: Golden generation and Past stars are rule-fixed and will match Method 4 exactly; the three k-means clusters will differ from the nearest-prototype assignments of Method 4 on the same remainder set.
