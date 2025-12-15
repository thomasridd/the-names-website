#!/usr/bin/env python3
"""
Time Series Clustering Analysis for Baby Names

Performs shape-based clustering using DTW (Dynamic Time Warping) to identify
trajectory archetypes in baby name popularity trends.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from tslearn.clustering import TimeSeriesKMeans
from tslearn.preprocessing import TimeSeriesScalerMeanVariance
from sklearn.metrics import silhouette_score
import warnings
warnings.filterwarnings('ignore')

# Set style
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (15, 10)

print("=" * 70)
print("TIME SERIES CLUSTERING ANALYSIS - Baby Name Trends")
print("=" * 70)

# 1. Load the data
print("\n1. Loading data...")
df = pd.read_csv('data/countTimeSeries.csv')
print(f"   Loaded {len(df):,} names")

# Parse the name|gender column
df[['name', 'gender']] = df['name|gender'].str.split('|', expand=True)
df = df.drop('name|gender', axis=1)

# Extract time series columns (years 1996-2024)
year_columns = [str(year) for year in range(1996, 2025)]
timeseries_data = df[year_columns].values.astype(float)

print(f"   Time series shape: {timeseries_data.shape}")
print(f"   Year range: {year_columns[0]} - {year_columns[-1]}")

# Filter out names with all zeros (completely missing data)
non_zero_mask = timeseries_data.sum(axis=1) > 0
df_filtered = df[non_zero_mask].copy()
timeseries_filtered = timeseries_data[non_zero_mask]

print(f"   After filtering zero series: {len(df_filtered):,} names")

# Sample for computational efficiency (DTW is O(n²) complexity)
SAMPLE_SIZE = 8000
if len(df_filtered) > SAMPLE_SIZE:
    print(f"   Sampling {SAMPLE_SIZE:,} names for clustering (DTW is computationally expensive)...")
    # Stratified sampling by gender
    sample_indices = df_filtered.groupby('gender', group_keys=False).apply(
        lambda x: x.sample(n=min(len(x), SAMPLE_SIZE // 2), random_state=42)
    ).index
    df_filtered = df_filtered.loc[sample_indices].copy()
    timeseries_filtered = timeseries_filtered[df_filtered.index - df_filtered.index[0]]
    print(f"   Sample size: {len(df_filtered):,} names")

# 2. Normalize the time series
print("\n2. Normalizing time series...")
scaler = TimeSeriesScalerMeanVariance()
timeseries_normalized = scaler.fit_transform(timeseries_filtered)
print(f"   Normalized shape: {timeseries_normalized.shape}")

# 3. Determine optimal k using silhouette scores
print("\n3. Testing different k values...")
k_values = range(5, 9)
silhouette_scores = []
models = {}

for k in k_values:
    print(f"   Testing k={k}... (this may take 1-2 minutes)")
    model = TimeSeriesKMeans(
        n_clusters=k,
        metric="dtw",
        max_iter=10,
        n_init=3,
        random_state=42,
        verbose=True
    )
    labels = model.fit_predict(timeseries_normalized)
    score = silhouette_score(
        timeseries_normalized.reshape(len(timeseries_normalized), -1),
        labels
    )
    silhouette_scores.append(score)
    models[k] = {'model': model, 'labels': labels, 'score': score}
    print(f"   ✓ k={k} complete - Silhouette Score: {score:.4f}\n")

# Plot silhouette scores
plt.figure(figsize=(10, 6))
plt.plot(k_values, silhouette_scores, 'o-', linewidth=2, markersize=8)
plt.xlabel('Number of Clusters (k)', fontsize=12)
plt.ylabel('Silhouette Score', fontsize=12)
plt.title('Silhouette Score vs Number of Clusters', fontsize=14, fontweight='bold')
plt.grid(True, alpha=0.3)
plt.xticks(k_values)
for i, (k, score) in enumerate(zip(k_values, silhouette_scores)):
    plt.text(k, score + 0.005, f'{score:.4f}', ha='center', va='bottom', fontsize=9)
plt.tight_layout()
plt.savefig('data/silhouette_scores.png', dpi=150, bbox_inches='tight')
print(f"\n   Saved silhouette scores plot to data/silhouette_scores.png")

# Choose optimal k (highest silhouette score)
optimal_k = k_values[np.argmax(silhouette_scores)]
print(f"\n   Optimal k: {optimal_k} (Silhouette Score: {max(silhouette_scores):.4f})")

# 4. Use the optimal model
print(f"\n4. Using k={optimal_k} for final clustering...")
best_model = models[optimal_k]['model']
best_labels = models[optimal_k]['labels']
df_filtered['cluster'] = best_labels

# Get cluster sizes
cluster_sizes = pd.Series(best_labels).value_counts().sort_index()
print("\n   Cluster sizes:")
for cluster_id, size in cluster_sizes.items():
    pct = (size / len(df_filtered)) * 100
    print(f"   Cluster {cluster_id}: {size:,} names ({pct:.1f}%)")

# 5. Visualize cluster centroids
print("\n5. Visualizing cluster centroids...")
fig, axes = plt.subplots(2, int(np.ceil(optimal_k/2)), figsize=(18, 10))
axes = axes.flatten()

years = list(range(1996, 2025))

for cluster_id in range(optimal_k):
    ax = axes[cluster_id]

    # Get centroid
    centroid = best_model.cluster_centers_[cluster_id].ravel()

    # Get all series in this cluster
    cluster_series = timeseries_normalized[best_labels == cluster_id]

    # Plot individual series with low alpha
    for series in cluster_series[:100]:  # Limit to 100 for visibility
        ax.plot(years, series.ravel(), alpha=0.1, color='gray', linewidth=0.5)

    # Plot centroid
    ax.plot(years, centroid, linewidth=3, color='red', label='Centroid')

    # Styling
    ax.set_title(f'Cluster {cluster_id} (n={cluster_sizes[cluster_id]:,})',
                 fontsize=12, fontweight='bold')
    ax.set_xlabel('Year', fontsize=10)
    ax.set_ylabel('Normalized Count', fontsize=10)
    ax.legend(loc='upper left', fontsize=8)
    ax.grid(True, alpha=0.3)
    ax.axhline(y=0, color='black', linestyle='--', linewidth=0.5, alpha=0.5)

# Hide extra subplots if any
for i in range(optimal_k, len(axes)):
    axes[i].set_visible(False)

plt.suptitle('Time Series Cluster Centroids with Sample Trajectories',
             fontsize=16, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig('data/cluster_centroids.png', dpi=150, bbox_inches='tight')
print(f"   Saved cluster centroids plot to data/cluster_centroids.png")

# 6. Show example names from each cluster
print("\n6. Example names from each cluster:")
print("=" * 70)

for cluster_id in range(optimal_k):
    cluster_names = df_filtered[df_filtered['cluster'] == cluster_id]

    # Get examples with highest recent counts
    cluster_names['recent_avg'] = cluster_names[['2022', '2023', '2024']].mean(axis=1)
    examples = cluster_names.nlargest(10, 'recent_avg')[['name', 'gender', 'recent_avg']]

    print(f"\nCluster {cluster_id} ({cluster_sizes[cluster_id]:,} names):")
    print("-" * 70)
    for idx, row in examples.iterrows():
        print(f"  {row['name']:20s} ({row['gender']:4s}) - Recent avg: {row['recent_avg']:.0f}")

# 7. Analyze cluster characteristics
print("\n\n7. Cluster Characteristics:")
print("=" * 70)

for cluster_id in range(optimal_k):
    cluster_data = timeseries_filtered[best_labels == cluster_id]

    # Calculate statistics
    mean_start = cluster_data[:, :5].mean()  # First 5 years
    mean_end = cluster_data[:, -5:].mean()   # Last 5 years
    mean_peak = cluster_data.max(axis=1).mean()
    mean_overall = cluster_data.mean()

    # Trend
    if mean_end > mean_start * 1.5:
        trend = "Strong Growth"
    elif mean_end > mean_start * 1.1:
        trend = "Moderate Growth"
    elif mean_end < mean_start * 0.5:
        trend = "Strong Decline"
    elif mean_end < mean_start * 0.9:
        trend = "Moderate Decline"
    else:
        trend = "Stable"

    print(f"\nCluster {cluster_id}: {trend}")
    print(f"  Early period avg (1996-2000): {mean_start:.0f}")
    print(f"  Recent period avg (2020-2024): {mean_end:.0f}")
    print(f"  Average peak: {mean_peak:.0f}")
    print(f"  Overall average: {mean_overall:.0f}")

# 8. Save cluster assignments
print("\n\n8. Saving cluster assignments...")
output_file = 'data/countTimeSeries_with_clusters.csv'

# Add cluster column to original filtered dataframe
df_output = df_filtered.copy()

# Reorder columns
cols = ['name', 'gender', 'cluster'] + year_columns
df_output = df_output[cols]

# Save
df_output.to_csv(output_file, index=False)
print(f"   Saved to {output_file}")
print(f"   Total names: {len(df_output):,}")

print("\n" + "=" * 70)
print("ANALYSIS COMPLETE!")
print("=" * 70)
print(f"\nOutputs:")
print(f"  1. data/silhouette_scores.png - Optimal k selection")
print(f"  2. data/cluster_centroids.png - Cluster visualizations")
print(f"  3. {output_file} - Data with cluster assignments")
print()
