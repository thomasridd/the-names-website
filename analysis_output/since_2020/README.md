# Baby Name Recent Trends Analysis (2020-2024)

**Analysis Date:** December 18, 2025
**Dataset:** 41,570 baby names (18,099 boys + 23,471 girls)
**Time Period:** 2020-2024 (5 years only)

---

## Overview

This analysis focuses exclusively on the **last 5 years** (2020-2024) to identify current trends, rising stars, and recent patterns in baby name popularity. By focusing on recent data, we can better understand contemporary naming trends without the noise of historical patterns.

## Generated Files

### Data Files

1. **features_with_clusters.csv** (4.2MB, 41,570 rows)
   - Complete feature set for all names based on 2020-2024 data
   - Includes K-Means and HDBSCAN cluster assignments
   - Includes archetype labels and trajectory categories
   - 24 engineered features + cluster assignments

2. **cluster_summary.csv**
   - Summary statistics for each K-Means cluster (6 clusters)
   - Average values for key features per cluster
   - Cluster sizes and characteristics

3. **archetype_summary.csv**
   - Summary statistics for each identified archetype
   - Average years present, peak rank, trend slope

4. **trajectory_summary.csv**
   - Summary by trajectory type (rising, falling, stable, etc.)
   - Counts and average characteristics

5. **archetype_examples.txt**
   - Top 15 example names for each archetype
   - Easy reference for understanding archetype patterns

6. **notable_names.txt**
   - Top 20 rising names (steepest improvement 2020-2024)
   - Top 20 falling names (steepest decline 2020-2024)

### Visualizations

1. **cluster_feature_distributions.png**
   - 9 histograms showing feature distributions across K-Means clusters
   - Features: years_present, years_in_top10, peak_rank, rank_volatility, trend_slope, avg_rank, change_2020_to_2024, years_in_top100, first_rank

2. **cluster_trajectories.png**
   - Example name trajectories for each of the 6 K-Means clusters
   - Shows 5 example names per cluster (2020-2024 only)
   - Visualizes actual ranking changes year by year

3. **archetype_trajectories.png**
   - Example name trajectories for each archetype
   - Shows 5 example names per archetype
   - Demonstrates the characteristic pattern for each archetype

4. **archetype_distribution.png**
   - Bar chart showing count of names in each archetype
   - Highlights most common patterns in recent years

5. **cluster_heatmap.png**
   - Heatmap showing mean feature values for each K-Means cluster
   - Helps interpret what each cluster represents

6. **trajectory_distribution.png**
   - Bar chart showing distribution of trajectory types
   - Categories: strongly rising, rising, stable, declining, strongly declining, sparse

---

## Features Extracted (24 total)

### Presence Features (5-year window)
- **years_present**: Number of years present out of 5 (2020-2024)
- **years_in_top10**: Years ranked in top 10
- **years_in_top20**: Years ranked in top 20
- **years_in_top50**: Years ranked in top 50
- **years_in_top100**: Years ranked in top 100
- **continuous_5yr**: Binary - present all 5 years?

### Ranking Features
- **peak_rank**: Best (lowest) rank achieved 2020-2024
- **peak_year**: Year when peak rank was achieved
- **avg_rank**: Average rank across years present
- **first_rank**: Initial rank in first appearance
- **last_rank**: Final rank in last appearance
- **rank_2020**: Specific rank in 2020
- **rank_2024**: Specific rank in 2024

### Temporal Features
- **first_year**: Year of first appearance in 5-year window
- **last_year**: Year of last appearance in 5-year window
- **active_2024**: Binary - ranked in 2024?
- **new_in_period**: Binary - first appeared 2020-2024?
- **recent_entry**: Binary - entered 2022-2024?
- **exited**: Binary - was present but not in 2024?

### Trend Features
- **change_2020_to_2024**: Rank change from 2020 to 2024 (negative = improving)
- **improved_from_debut**: Binary - improved from first appearance?
- **rank_volatility**: Standard deviation of ranks (higher = more volatile)
- **trend_slope**: Linear slope over available years (negative = improving)
- **trajectory**: Categorical - strongly_rising, rising, stable, declining, strongly_declining, sparse

---

## Clustering Results

### K-Means Clustering (6 clusters)

**Cluster 0** (7,481 names): Consistent mid-to-high performers
- Nearly all 5 years present (avg 4.99)
- Mid-range peak ranks (avg 1,539)
- Moderate volatility
- Slight positive trend (slowly declining)

**Cluster 1** (18,407 names): Never ranked in this period
- Zero years present
- These names did not appear in top rankings 2020-2024
- Largest cluster (44% of all names)

**Cluster 2** (8,861 names): Rare/sporadic appearances
- Minimal presence (avg 1.57 years)
- Poor peak ranks (avg 4,555)
- High volatility when present
- Generally declining

**Cluster 3** (22 names): Elite top 10 dominants
- All 5 years present
- Exceptional peak ranks (avg 4.8 - top 5!)
- Very low volatility (highly stable)
- Examples: Muhammad, Noah, Oliver, Arthur, Leo

**Cluster 4** (6,712 names): Occasional appearances
- Low presence (avg 2.46 years)
- Poor peak ranks (avg 4,047)
- High volatility
- Mixed trends

**Cluster 5** (85 names): Strong consistent performers
- All 5 years present
- Excellent peak ranks (avg 25.9 - top 30!)
- Very stable (low volatility)
- Slightly improving trend

### HDBSCAN Clustering

- Found 38 distinct clusters
- More granular segmentation than K-Means
- Better at identifying niche patterns and outliers

---

## Identified Archetypes (7 types)

### 1. **Top Tier Stable** (35 names)
- Examples: Muhammad, Noah, Oliver, Arthur, Leo, George, Theodore
- Present all 5 years with top ranks
- Average peak rank: 7.4 (elite!)
- Average rank: 10.0
- Extremely stable (trend slope near 0)

**Pattern:** The absolute elite - consistently in top 10-15 across all 5 years with minimal variation.

### 2. **Steady Performer** (109 names)
- Examples: Albie, Mohammed, Elijah, Rory, Lucas, William
- Present all 5 years
- Average peak rank: 47.6
- Low volatility, stable trends
- Reliable top 100 names

**Pattern:** Consistently ranked names that maintain their position year after year without dramatic changes.

### 3. **Rising Star** (659 names)
- Examples: Luca, Jude, Oakley, Rowan, Hudson, Sonny
- Average 3.46 years present
- Strong negative trend (avg slope: -410.6 = improving rapidly!)
- Active in 2024

**Pattern:** Names showing significant upward momentum, improving their rankings substantially over the 5-year period.

### 4. **New Entrant** (3,015 names)
- Examples: Gurnawab, Kayce, Elhan, Shubhdeep, Avitaj
- First appeared 2022-2024
- Low years present (avg 1.45)
- Generally improving (negative trend slope)
- All active in 2024

**Pattern:** Names that newly entered the rankings in the last 3 years and are gaining initial traction.

### 5. **Fading** (1,628 names)
- Examples: Joshua, Benjamin, Mason, Logan, Toby, Grayson
- Average 3.18 years present
- Strong positive trend (avg slope: 409.5 = declining rapidly)
- Losing popularity

**Pattern:** Names experiencing significant decline in popularity over the 5-year period.

### 6. **Volatile** (9,152 names)
- Examples: Enzo, Otto, Abdul, Atlas, Cillian, Remi, Jake
- High presence (avg 4.76 years)
- Significant rank swings
- Mixed trends overall

**Pattern:** Names with unpredictable patterns, showing significant variation year-to-year without clear direction.

### 7. **Unknown** (26,970 names)
- 65% of all names
- Very limited presence (avg 0.45 years)
- No clear pattern

**Pattern:** Names with insufficient data to classify - either never ranked or appeared only sporadically.

---

## Trajectory Analysis

### Distribution by Trajectory Type

1. **Sparse** (25,908 names, 62%)
   - Minimal data (<2 years present)
   - Cannot determine trend

2. **Strongly Declining** (8,598 names, 21%)
   - Trend slope > 10 (rank increasing = getting worse)
   - Average slope: 391.9
   - Average years: 3.73

3. **Strongly Rising** (6,146 names, 15%)
   - Trend slope < -10 (rank decreasing = getting better)
   - Average slope: -413.9
   - Average years: 3.97

4. **Declining** (347 names, <1%)
   - Modest decline (slope 2-10)
   - Average slope: 5.76
   - Nearly all 5 years present

5. **Rising** (320 names, <1%)
   - Modest improvement (slope -2 to -10)
   - Average slope: -5.67
   - Nearly all 5 years present

6. **Stable** (249 names, <1%)
   - Minimal slope (-2 to 2)
   - Average slope: 0.16
   - Consistent presence

---

## Key Insights

### 1. Elite Stability
Only **35 names** (0.08%) qualify as "Top Tier Stable" - truly elite names that dominate the top 10-15 consistently. These are the safest, most established choices.

### 2. Rising Momentum
**6,146 names** are "strongly rising" - showing significant upward trends. This is 15% of all names analyzed, indicating substantial churn and diversification in naming preferences.

### 3. New Diversity
**3,015 new entrants** (7%) appeared for the first time in 2022-2024, showing continued innovation and cultural influence in naming.

### 4. Volatility is Common
**9,152 names** (22%) show volatile patterns - significant year-to-year swings. This suggests many names experience unpredictable popularity changes.

### 5. Most Names are Rare
**65% of names** have minimal or no presence in top rankings over this 5-year period, indicating the long tail of naming choices.

### 6. Strong Trends are Dramatic
Names classified as "strongly rising" improved by an average of **414 ranks** over the period. "Strongly declining" names fell by an average of **392 ranks**. These are substantial movements!

---

## Notable Names (Top Movers 2020-2024)

### Top Rising Names
- **Avitaaz**: Improved by 3,272 positions! (N/A → 1,517)
- **Azlin, Azwa**: Both improved by 3,113 positions
- **Charis**: Improved by 3,040 positions (N/A → 1,952)
- **Carmen**: Improved by 2,728 positions (N/A → 2,264)

### Top Falling Names
- **Roksana**: Declined by 1,814 positions (2,042 → N/A)
- **Ezinne, Aleigha**: Both declined by 1,638 positions
- **Lacey-May, Mileja**: Both declined by 1,610 positions

---

## Using This Data

### For Trend Spotting
- Check "Rising Star" and "Strongly Rising" trajectories for emerging trends
- Look at "New Entrant" names for the cutting edge
- Monitor "Fading" names to avoid declining popularity

### For Stability Analysis
- "Top Tier Stable" and "Steady Performer" are safest choices
- Low volatility indicates predictable future rankings
- High volatility = risk of dramatic changes

### For Cultural Analysis
- Compare archetypes across genders
- Identify cultural influences from new entrants
- Track which types of names are gaining vs. losing

### For Prediction
- Use trend slopes to project 2025-2026 rankings
- Cluster assignments help identify similar name trajectories
- Volatility metrics indicate prediction confidence

---

## Comparison to Full Historical Analysis

**Key Differences from all_ranks analysis:**

1. **Timeframe**: Only 2020-2024 vs. 1904-2024
2. **Focus**: Current trends vs. century-long patterns
3. **Resolution**: Year-by-year vs. decade-aggregated early data
4. **Clusters**: 6 clusters vs. 8 (simpler with less data)
5. **Archetypes**: Different types (e.g., "Top Tier Stable" vs. "Century Classic")

**When to use each:**
- Use this (2020-2024) analysis for understanding **current trends** and **recent momentum**
- Use all_ranks analysis for understanding **historical patterns** and **long-term classics**

---

## Reproducibility

To regenerate this analysis:

```bash
# From project root
python3 scripts/analyze_recent_5yr.py
```

**Requirements:**
- pandas
- numpy
- matplotlib
- seaborn
- scikit-learn
- hdbscan (optional, for HDBSCAN clustering)

**Runtime:** ~30-60 seconds for full analysis

---

## Notes

- Analysis uses only columns 2020-2024 from all_ranks.csv
- "x" values indicate name was not in top 100 (or <3 babies given that name)
- All rank values: lower = more popular (rank 1 = most popular)
- Missing values handled appropriately in feature engineering
- Standardization applied before clustering
- Trend slopes calculated using linear regression where ≥2 data points available
- Negative slope = improving rank (getting more popular)
- Positive slope = declining rank (getting less popular)
