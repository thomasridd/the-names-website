# Baby Name Time Series Analysis Results

**Analysis Date:** December 18, 2025
**Dataset:** 41,570 baby names (18,099 boys + 23,471 girls)
**Time Period:** 1904-2024 (39 time periods: 10 decades + 29 years)

---

## Overview

This analysis extracts meaningful features from sparse time series data of baby name rankings and performs clustering to identify distinct patterns and archetypes.

## Generated Files

### Data Files

1. **features_with_clusters.csv** (5.2MB, 41,570 rows)
   - Complete feature set for all names
   - Includes K-Means and HDBSCAN cluster assignments
   - Includes archetype labels
   - 19 engineered features + cluster assignments

2. **cluster_summary.csv**
   - Summary statistics for each K-Means cluster (8 clusters)
   - Average values for key features per cluster
   - Cluster sizes and characteristics

3. **archetype_summary.csv**
   - Summary statistics for each identified archetype
   - Average years in top 100, peak rank, first/last year

4. **archetype_examples.txt**
   - Top 10 example names for each archetype
   - Easy reference for understanding archetype patterns

### Visualizations

1. **cluster_feature_distributions.png**
   - 9 histograms showing feature distributions across K-Means clusters
   - Features: years_in_top100, years_in_top10, peak_rank, rank_volatility, longest_run, recent_trend, recency_score, avg_rank_when_present, recent_5yr_in_top100

2. **cluster_trajectories.png**
   - Example name trajectories for each of the 8 K-Means clusters
   - Shows 3 example names per cluster
   - Visualizes sparse data (gaps indicate years not in top 100)

3. **archetype_trajectories.png**
   - Example name trajectories for each archetype
   - Shows 3 example names per archetype
   - Demonstrates the characteristic pattern for each archetype

4. **archetype_distribution.png**
   - Bar chart showing count of names in each archetype
   - Highlights most common patterns

5. **cluster_heatmap.png**
   - Heatmap showing mean feature values for each K-Means cluster
   - Helps interpret what each cluster represents

---

## Features Extracted (19 total)

### Presence Features
- **years_in_top100**: Total number of time periods the name appeared in top 100
- **years_in_top10**: Number of time periods in top 10
- **recent_5yr_in_top100**: Years in top 100 from 2020-2024
- **decades_present**: Number of decades (1904-1994) with top 100 ranking
- **modern_years_present**: Number of years (1996-2024) with ranking

### Ranking Features
- **peak_rank**: Best (lowest) rank ever achieved
- **peak_year**: Year when peak rank was achieved
- **avg_rank_when_present**: Average rank across all appearances
- **first_rank**: Initial rank when name first appeared
- **last_rank**: Most recent rank

### Temporal Features
- **first_year**: Year of first appearance in top 100
- **last_year**: Year of last appearance in top 100
- **longest_run**: Length of longest continuous run in top 100

### Pattern Features
- **debut_high**: Binary (1/0) - Did name debut in top 20?
- **improved_from_debut**: Binary (1/0) - Did name improve from initial rank?
- **rank_volatility**: Standard deviation of ranks (higher = more volatile)
- **recent_trend**: Slope of last 10 years (negative = improving)
- **recency_score**: Weighted score favoring recent appearances
- **active_2024**: Binary (1/0) - Is name ranked in 2024?

---

## Clustering Results

### K-Means Clustering (8 clusters)

**Cluster 0** (302 names): Established classics
- High years in top 100 (avg 33.0)
- Low average peak rank (28.5)
- High recency and long runs

**Cluster 1** (7,274 names): Rare/unpopular names
- Very few years in top 100 (avg 5.5)
- Poor peak ranks (avg 3,439)
- Low recency scores

**Cluster 2** (5,071 names): Moderate historic presence
- Good number of years (avg 26.6)
- Mid-range peak ranks (avg 816)
- High recency

**Cluster 3** (11,028 names): Barely ranked names
- Minimal top 100 appearances (avg 1.4)
- Very poor peak ranks (avg 5,134)
- Lowest recency

**Cluster 4** (52 names): Elite classics
- Very high years in top 100 (33.8)
- Excellent peak ranks (avg 7.8)
- Multiple years in top 10

**Cluster 5** (9,055 names): Occasional appearances
- Few years in top 100 (avg 2.9)
- Poor peak ranks (avg 3,306)
- Very low recency

**Cluster 6** (4,110 names): Rising names
- Moderate years (avg 11.0)
- Mid-range peaks (avg 2,315)
- Medium recency

**Cluster 7** (4,676 names): Established modern names
- Good number of years (avg 17.0)
- Decent peak ranks (avg 1,773)
- Higher recency

### HDBSCAN Clustering

- Found 79 distinct clusters
- More granular than K-Means
- Identifies outliers and noise (-1 label)

---

## Identified Archetypes (7 types)

### 1. **Century Classic** (68 names)
- Examples: George, Henry, Harry, Mohammed, Jack, Thomas, William
- Average: 37.4 years in top 100
- Average peak rank: 13.2
- First appeared: ~1907 on average
- Still active in 2024

**Pattern:** Names that have maintained popularity across the entire time period, appearing in top 100 for decades.

### 2. **Comeback Kid** (293 names)
- Examples: Oliver, Arthur, Louis, Mohammad, Jesse, Frederick
- Average: 31.5 years in top 100
- Average peak rank: 41.8
- First appeared: ~1926 on average

**Pattern:** Names with gaps in top 100 presence that have recently returned to popularity.

### 3. **Rising Star** (5,161 names)
- Examples: Luca, Jude, Arlo, Albie, Rory, Roman, Oakley, Ezra
- Average: 15.8 years in top 100
- First appeared: ~2006 on average
- All active in 2024

**Pattern:** Names that have improved significantly from their debut, showing strong upward trends in recent years.

### 4. **Recent Entrant** (2,247 names)
- Examples: Ayaan, Parker, Jaxson, Rocco, Aarav, Nikodem
- Average: 12.9 years in top 100
- First appeared: ~2009 on average
- All active in 2024

**Pattern:** Names that first entered top 100 after 2000 and are currently gaining momentum.

### 5. **Steady Classic** (7 names)
- Examples: Charlie, Jacob, Adam, Max, Harrison, Olivia, Phoebe
- Average: 30.1 years in top 100
- Average peak rank: 12.1
- Low volatility (consistent ranks)

**Pattern:** Names with long, stable presence in top 100 with minimal rank fluctuation.

### 6. **Declining Former Favorite** (2 names)
- Examples: Carol, Tracey
- Average: 26.5 years in top 100
- Average peak rank: 6.5
- Peaked in 1950s-1970s

**Pattern:** Names that were once very popular (top 20) but have fallen out of favor and are no longer ranked.

### 7. **Unknown** (33,790 names)
- Names that don't fit clearly into defined patterns
- Generally have limited top 100 presence
- Average: 6.8 years in top 100

---

## Key Insights

1. **Most names are rare**: 81% of names (33,790) don't fit clear archetype patterns, indicating most names have limited or sporadic top 100 presence.

2. **Rising stars dominate modern era**: 5,161 names show upward trajectories, with many entering popularity after 2005.

3. **Recent entrants are numerous**: 2,247 names first appeared in top 100 after 2000, showing diversification of naming trends.

4. **True classics are rare**: Only 68 names qualify as "Century Classics" with sustained popularity across multiple decades.

5. **Comebacks happen**: 293 names have returned to popularity after periods of absence.

6. **Very few declining favorites**: Only 2 names fit the "Declining Former Favorite" pattern, suggesting once-popular names either maintain presence or disappear completely.

---

## Using This Data

### For Further Analysis
- Load `features_with_clusters.csv` for custom analysis
- Use cluster assignments for segmentation
- Filter by archetype for pattern-specific studies
- Examine feature correlations

### For Visualization
- Plot individual name trajectories using original `all_ranks.csv`
- Create cluster-specific visualizations
- Compare archetype characteristics
- Analyze temporal trends

### For Classification
- Use features to predict future trends
- Build models to classify new names
- Identify emerging patterns early

---

## Reproducibility

To regenerate this analysis:

```bash
# From project root
python3 scripts/analyze_all_ranks.py
```

**Requirements:**
- pandas
- numpy
- matplotlib
- seaborn
- scikit-learn
- hdbscan (optional, for HDBSCAN clustering)

**Runtime:** ~1-2 minutes for full analysis

---

## Notes

- "x" values in original data indicate name was not in top 100 (or <3 babies given that name)
- Decade data (1904-1994) represents top 100 rankings per decade
- Yearly data (1996-2024) represents annual top rankings with more detail
- All rank values: lower = more popular (rank 1 = most popular)
- Missing values handled appropriately in feature engineering
- Standardization applied before clustering
