# Method: Current Popular Clustering

Reference specification for reproducing **Method 3** from `/analyses/labelled-clusters/` — the labelled feature-space k-means clustering that partitions the currently popular names into four historic-pattern categories.

## Purpose

Partition today's (2024) top 100 baby names into four named categories based on their historic ranking trajectory:

- **Classics** — consistently popular across the century
- **Modern classics** — consistently popular in recent decades
- **Shooting stars** — new arrivals to the top 100
- **Vintage revival** — popular early, absent mid-century, popular again

## Inputs

Two JSON files: `boys.json`, `girls.json` (or their `-dev` variants). Each record is expected to carry at least:

| field | type | description |
|---|---|---|
| `name` | string | display name |
| `rank` | number | 2024 rank (1 = most popular) |
| `rankHistoric` | string[13] | rank per decade, 1904 → 2024 in 10-year steps; numeric string or `"x"` if unranked |
| `uniqueSlug` | string | URL slug (optional, for linking out) |

The 13 decade labels are: `1904, 1914, 1924, 1934, 1944, 1954, 1964, 1974, 1984, 1994, 2004, 2014, 2024`.

## Step 1 — Filter

Keep only names with `1 ≤ rank ≤ 100` (i.e. the 2024 top 100). Combine boys and girls into a single dataset; retain `gender` as metadata. Drop records missing `rankHistoric` or whose `rankHistoric` length is not 13.

## Step 2 — Featurise

For each name, parse `rankHistoric` into 13 numeric ranks (`null` for `"x"`), then compute:

```
bin100[i] = 1 if rank[i] in [1,100] else 0
bin50[i]  = 1 if rank[i] in [1, 50] else 0
```

From these derive 5 summary features:

| # | feature | definition | normalisation |
|---|---|---|---|
| f1 | `sumTop100` | count of decades where `bin100 == 1` | divide by 13 |
| f2 | `sumTop50`  | count of decades where `bin50  == 1` | divide by 13 |
| f3 | `firstTop100` | index of first `bin100 == 1` (`-1` if none) | divide by 12; use `1.0` if none |
| f4 | `lastTop100`  | index of last `bin100 == 1` (`-1` if none) | divide by 12; use `0.0` if none |
| f5 | `longestGap`  | longest run of `bin100 == 0` strictly between the first and last `1` | divide by 13 |

Each name is therefore represented by a 5-dimensional vector in `[0, 1]⁵`.

Because every record has 2024 rank ≤ 100, `bin100[12] == 1` and hence `lastTop100 == 12` for every input, so f4 is constant at 1.0 under the current filter (still included so the feature space is consistent if the filter is ever relaxed).

## Step 3 — Initial centroids (labelled prototypes)

Seed k-means with four labelled centroids, one per target category:

```
Classics         [1.00, 0.70, 0.00, 1.00, 0.00]
Modern classics  [0.40, 0.30, 0.60, 1.00, 0.00]
Shooting stars   [0.10, 0.00, 1.00, 1.00, 0.00]
Vintage revival  [0.30, 0.15, 0.00, 1.00, 0.60]
```

The ordering is fixed so that cluster `i` always refers to the same label after iteration. Because the clusters are label-seeded rather than randomly initialised, the output is deterministic and each converged cluster retains its intended semantic label.

## Step 4 — K-means iteration

Lloyd's algorithm with `k = 4`, squared Euclidean distance, and up to 100 iterations:

```
repeat up to 100 times:
  for each point:
    assign to nearest centroid by squared Euclidean distance
  if no assignments changed (after iter 0): break
  for each cluster c:
    if non-empty: centroid[c] = mean of member feature vectors
    if empty:     leave centroid unchanged
```

Empty clusters are left at their previous centroid (do **not** reseed). Ties on distance go to the lower-index centroid (i.e. the order listed above).

## Step 5 — Output

Each point inherits the label of its assigned cluster index. Within each cluster, members are sorted by 2024 `rank` ascending, breaking ties alphabetically. A convenient rendering is a centroid strip (each decade shaded by that cluster's share of top-100 presence) followed by a per-name binary heatmap.

## Reference implementation

A working JavaScript implementation lives in `.eleventy.js` under the `labelledClusters` global data function (the `Method 3` block). A from-scratch script should reproduce the same assignments given the same input JSON.

## Example cluster sizes (dev data, 200 names = 100 boys + 100 girls)

| label | count |
|---|---|
| Classics | 19 |
| Modern classics | 54 |
| Shooting stars | 89 |
| Vintage revival | 38 |

These numbers are expected to change on the full dataset but the partition shape should remain stable.
