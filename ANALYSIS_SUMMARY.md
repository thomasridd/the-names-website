# Baby Name Time Series Analysis - Summary Report

**Dataset:** countTimeSeries.csv
**Analysis Date:** December 14, 2025
**Names Analyzed:** 41,570
**Time Period:** 1996-2024 (29 years)

---

## Executive Summary

This analysis extracted meaningful features from ~41,000 baby name time series to identify distinct naming patterns and archetypes. Using k-means clustering, we discovered 8 distinct groups of names based on their popularity trajectories, volatility, and temporal patterns.

---

## Key Findings

### 8 Distinct Name Archetypes Identified

#### 1. **Extremely Rare Names** (Cluster 4)
- **Count:** 12,619 names (30.4%)
- **Characteristics:**
  - Peak count: ~4 babies per year
  - Very low volatility
  - Consistently present but barely used
- **Examples:** Gurnawab, Barkat, Novie

#### 2. **Consistently Rare Names** (Cluster 0)
- **Count:** 15,924 names (38.3%)
- **Characteristics:**
  - Peak count: ~15 babies per year
  - Slight negative trajectory (-0.23)
  - More popular in early years (avg 7.9) than recent (avg 2.1)
- **Examples:** Ellen, Paul, Catherine

#### 3. **Emerging Rare Names** (Cluster 3)
- **Count:** 12,661 names (30.5%)
- **Characteristics:**
  - Peak count: ~29 babies per year
  - Strong positive trajectory (+4.56)
  - Recently gaining popularity (recent avg: 17.0 vs early avg: 3.9)
- **Examples:** Corey, Darcey, Ewan

#### 4. **Rising Star Names** (Cluster 6)
- **Count:** 201 names (0.5%)
- **Characteristics:**
  - Peak count: ~1,164 babies per year
  - **Extremely strong positive trajectory (+27.25)**
  - Recent popularity (avg 737) far exceeds early years (avg 217)
- **Examples:** Logan, Mason, Isabelle

#### 5. **Fading Classic Names** (Cluster 2)
- **Count:** 86 names (0.2%)
- **Characteristics:**
  - Peak count: ~1,872 babies per year
  - Negative trajectory (-0.76)
  - Early popularity (avg 1,481) far exceeds recent (avg 251)
- **Examples:** Laura, Christopher, Holly

#### 6. **Modern Hit Names** (Cluster 1)
- **Count:** 41 names (0.1%)
- **Characteristics:**
  - Peak count: ~4,121 babies per year
  - Positive trajectory (+3.50)
  - Recent popularity (avg 2,248) more than double early years (avg 1,051)
- **Examples:** Oliver, Amelia, Muhammad

#### 7. **Fading Mega-Hit Names** (Cluster 7)
- **Count:** 32 names (0.1%)
- **Characteristics:**
  - Peak count: ~5,571 babies per year
  - Negative trajectory (-0.77)
  - Early popularity (avg 4,797) far exceeds recent (avg 722)
- **Examples:** Harry, Matthew, Sophie

#### 8. **Fading Mega-Hit Names - Top Tier** (Cluster 5)
- **Count:** 6 names (0.01%)
- **Characteristics:**
  - Peak count: ~9,732 babies per year (HIGHEST)
  - Negative trajectory (-0.72)
  - Early popularity (avg 8,655) far exceeds recent (avg 1,570)
  - Names that once dominated but are now declining
- **Examples:** Jack, Daniel, James

---

## Feature Engineering

The analysis extracted **30 features** from each name's time series:

### Presence Features
- Years present/absent
- Presence ratio
- Number of continuous runs
- Longest continuous run

### Peak Features
- Peak count (maximum babies in any year)
- Peak year
- Peak year normalized (temporal position of peak)

### Trend Features
- Mean count, median count, total count
- Standard deviation and coefficient of variation
- Trajectory (comparing first third to last third)
- Mean change, max increase, max decrease
- Volatility (standard deviation of changes)

### Temporal Features
- First/last year and counts
- Debut strength
- Recent activity (2020-2024)
- Early activity (1996-2000)
- Recent vs. early comparison

---

## Clustering Methodology

### Approach
- **Algorithm:** K-means with 8 clusters
- **Preprocessing:** StandardScaler normalization
- **Validation:** Also performed HDBSCAN clustering
- **Visualization:** PCA projection for 2D visualization

### Why These Features Work
The features capture three key dimensions:
1. **Scale** (peak count, total count) - How popular is the name?
2. **Trajectory** (positive/negative trend) - Is it rising or falling?
3. **Temporality** (early vs. recent) - When was it most popular?

These dimensions effectively separate names into meaningful archetypes.

---

## Notable Patterns

### 1. The Long Tail
- **69% of all names** fall into "Extremely Rare" or "Consistently Rare" categories
- Most names never achieve widespread popularity
- The naming landscape has huge diversity at the low end

### 2. Rising Stars Phenomenon
- 201 names (0.5%) show dramatic trajectory (+27.25 average)
- These names transformed from uncommon (217 avg) to popular (737 avg)
- Examples: Logan, Mason, Isabelle

### 3. The Fall of Former Giants
- 38 names that once peaked at 5,000+ babies are now declining
- Classic names like Jack, Daniel, James, Harry falling from dominance
- Represents generational shift in naming preferences

### 4. Modern Mega-Hits
- 41 names achieving 4,000+ peak while still rising
- Examples: Oliver, Amelia, Muhammad
- These are the current generation's naming champions

---

## Archetype Distribution

| Archetype | Count | % of Total | Avg Peak Count |
|-----------|-------|------------|----------------|
| Consistently Rare | 15,924 | 38.3% | 15 |
| Emerging Rare | 12,661 | 30.5% | 29 |
| Extremely Rare | 12,619 | 30.4% | 4 |
| Rising Star | 201 | 0.5% | 1,164 |
| Fading Classic | 86 | 0.2% | 1,872 |
| Modern Hit | 41 | 0.1% | 4,121 |
| Fading Mega-Hit | 32 | 0.1% | 5,571 |
| Fading Mega-Hit (Top Tier) | 6 | 0.01% | 9,732 |

---

## Visualizations Generated

1. **clusters_pca_kmeans.png**
   - PCA projection showing cluster separation
   - Both K-means and HDBSCAN clustering visualized

2. **feature_distributions.png**
   - Histograms of 7 key features across all 8 clusters
   - Shows how features distinguish clusters

3. **trajectory_examples.png**
   - Sample time series from each cluster
   - Visual representation of typical patterns
   - Nulls visible (sparse data handling)

---

## Data Quality Notes

### Sparse Data Handling
- Values marked as "x" (< 3 babies) converted to NaN
- Features designed to work with missing data
- Continuous runs detected despite gaps

### Coverage
- All 41,570 names present for all 29 years
- 100% presence ratio across dataset
- Rich time series with no structural missingness

---

## Actionable Insights

### For Website Features
1. **Classification Tags:** Use archetypes as classification labels
2. **Trending Section:** Highlight "Rising Star" and "Modern Hit" names
3. **Nostalgia Section:** Feature "Fading Mega-Hit" names
4. **Hidden Gems:** Showcase "Emerging Rare" names for unique choices

### For Analysis
1. **Trajectory Score:** Use trajectory feature as "momentum" indicator
2. **Peak Era:** Use peak_year_normalized to identify generational names
3. **Volatility Filter:** Use volatility to find "stable" vs. "trendy" names

---

## Files Generated

- `name_features.csv` - Full dataset with 30 features + cluster assignments
- `archetypes.csv` - Archetype summaries and statistics
- `cluster_summary.csv` - Aggregate statistics per cluster
- `clusters_pca_kmeans.png` - Cluster visualization
- `feature_distributions.png` - Feature distribution analysis
- `trajectory_examples.png` - Example trajectories per cluster

---

## Technical Details

**Script:** `scripts/analyze_name_features.py`
**Libraries:** pandas, numpy, matplotlib, seaborn, scikit-learn, hdbscan
**Runtime:** ~45 seconds for full analysis
**Memory:** ~2GB peak usage

---

## Next Steps

1. **Extend to Historic Data:** Apply similar analysis to 13-decade historic data
2. **Gender Comparison:** Analyze differences in archetype distribution by gender
3. **Regional Analysis:** If regional data available, identify geographic patterns
4. **Prediction:** Use features to predict future trajectories
5. **Interactive Viz:** Create interactive dashboard for exploring clusters

---

*Analysis completed using feature extraction, k-means clustering, and hierarchical archetype classification.*
