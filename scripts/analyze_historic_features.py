#!/usr/bin/env python3
"""
Historic Rank Time Series Feature Analysis and Clustering

Analyzes baby name historic rankings to identify patterns and archetypes.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

# Try to import HDBSCAN
try:
    import hdbscan
    HAS_HDBSCAN = True
except ImportError:
    HAS_HDBSCAN = False
    print("HDBSCAN not available, will use k-means only")
    print("Install with: pip3 install hdbscan")

# Configuration
INPUT_FILE = 'data/rankHistoricTimeSeries.csv'
OUTPUT_DIR = 'analysis_output'
DECADES = ['1900s', '1910s', '1920s', '1930s', '1940s', '1950s', '1960s', '1970s',
           '1980s', '1990s', '2000s', '2010s', '2020s']

import os
os.makedirs(OUTPUT_DIR, exist_ok=True)

def load_data():
    """Load and preprocess the time series data."""
    print("Loading data...")
    df = pd.read_csv(INPUT_FILE, sep=',')

    # Split name|gender column
    split_cols = df['name|gender'].str.split('|', expand=True)
    df['name'] = split_cols[0]
    df['gender'] = split_cols[1]
    df = df.drop('name|gender', axis=1)

    # Convert 'x' to NaN for numeric operations
    for decade in DECADES:
        df[decade] = pd.to_numeric(df[decade].replace('x', np.nan), errors='coerce')

    print(f"Loaded {len(df)} names")
    print(f"Decades: {DECADES[0]} to {DECADES[-1]}")

    return df

def engineer_features(df):
    """Create meaningful features from sparse time series data."""
    print("\nEngineering features...")

    features = pd.DataFrame()
    features['name'] = df['name']
    features['gender'] = df['gender']

    # Create decade index mapping
    decade_to_idx = {decade: idx for idx, decade in enumerate(DECADES)}

    # Feature 1: Years in top 100
    features['years_in_top100'] = df[DECADES].notna().sum(axis=1)

    # Feature 2: Peak ranking (lower is better)
    features['peak_rank'] = df[DECADES].min(axis=1)

    # Feature 3: Decade of peak ranking
    peak_decade_idx = df[DECADES].idxmin(axis=1)
    features['peak_decade_idx'] = peak_decade_idx.map(decade_to_idx)
    features['peak_decade'] = peak_decade_idx

    # Feature 4: First appearance decade
    first_decade = df[DECADES].notna().idxmax(axis=1)
    features['first_decade_idx'] = first_decade.map(decade_to_idx)
    features['first_decade'] = first_decade

    # Feature 5: Last appearance decade
    last_decade = df[DECADES].apply(lambda row: row[row.notna()].index[-1] if row.notna().any() else np.nan, axis=1)
    features['last_decade_idx'] = last_decade.map(decade_to_idx)
    features['last_decade'] = last_decade

    # Feature 6: Entry rank (rank in first decade)
    def get_entry_rank(idx):
        first_dec = features.loc[idx, 'first_decade']
        if pd.notna(first_dec) and first_dec in df.columns:
            return df.loc[idx, first_dec]
        return np.nan
    features['entry_rank'] = features.index.map(get_entry_rank)

    # Feature 7: Exit rank (rank in last decade)
    def get_exit_rank(idx):
        last_dec = features.loc[idx, 'last_decade']
        if pd.notna(last_dec) and last_dec in df.columns:
            return df.loc[idx, last_dec]
        return np.nan
    features['exit_rank'] = features.index.map(get_exit_rank)

    # Feature 8: Volatility (std dev of rankings when present)
    features['volatility'] = df[DECADES].std(axis=1)

    # Feature 9: Range of rankings (max - min when present)
    features['rank_range'] = df[DECADES].max(axis=1) - df[DECADES].min(axis=1)

    # Feature 10: Longest continuous run
    def longest_run(row):
        values = [1 if pd.notna(row[d]) else 0 for d in DECADES]
        max_run = 0
        current_run = 0
        for v in values:
            if v == 1:
                current_run += 1
                max_run = max(max_run, current_run)
            else:
                current_run = 0
        return max_run

    features['longest_run'] = df.apply(longest_run, axis=1)

    # Feature 11: Number of gaps (times it left and came back)
    def count_gaps(row):
        values = [1 if pd.notna(row[d]) else 0 for d in DECADES]
        gaps = 0
        in_gap = False
        for v in values:
            if v == 0 and not in_gap and any(values[:values.index(v)]):
                in_gap = True
            elif v == 1 and in_gap:
                gaps += 1
                in_gap = False
        return gaps

    features['num_gaps'] = df.apply(count_gaps, axis=1)

    # Feature 12: Trajectory (rising, falling, stable)
    def calculate_trajectory(row):
        ranks = [row[d] for d in DECADES if pd.notna(row[d])]
        if len(ranks) < 2:
            return 0
        # Linear regression slope (negative slope = improving rank)
        x = np.arange(len(ranks))
        slope = np.polyfit(x, ranks, 1)[0]
        return slope

    features['trajectory'] = df.apply(calculate_trajectory, axis=1)

    # Feature 13: Recent presence (in last 3 decades?)
    recent_decades = DECADES[-3:]
    features['recent_presence'] = df[recent_decades].notna().any(axis=1).astype(int)

    # Feature 14: Early presence (in first 3 decades?)
    early_decades = DECADES[:3]
    features['early_presence'] = df[early_decades].notna().any(axis=1).astype(int)

    # Feature 15: Ever top 10?
    features['ever_top10'] = (df[DECADES] <= 10).any(axis=1).astype(int)

    # Feature 16: Ever top 20?
    features['ever_top20'] = (df[DECADES] <= 20).any(axis=1).astype(int)

    print(f"Created {len(features.columns) - 2} features")  # -2 for name and gender

    return features, df

def perform_clustering(features):
    """Perform clustering analysis."""
    print("\nPerforming clustering analysis...")

    # Select numeric features for clustering
    feature_cols = [col for col in features.columns
                    if col not in ['name', 'gender', 'first_decade', 'last_decade', 'peak_decade']]

    # Remove rows with any NaN in features
    X = features[feature_cols].dropna()
    valid_indices = X.index

    print(f"Using {len(X)} samples with complete features")
    print(f"Features used: {feature_cols}")

    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    results = {}

    # K-means clustering
    print("\nRunning k-means (k=6)...")
    kmeans = KMeans(n_clusters=6, random_state=42, n_init=10)
    kmeans_labels = kmeans.fit_predict(X_scaled)
    results['kmeans'] = {
        'labels': kmeans_labels,
        'model': kmeans,
        'valid_indices': valid_indices
    }

    # HDBSCAN clustering
    if HAS_HDBSCAN:
        print("Running HDBSCAN...")
        clusterer = hdbscan.HDBSCAN(min_cluster_size=50, min_samples=10)
        hdbscan_labels = clusterer.fit_predict(X_scaled)
        results['hdbscan'] = {
            'labels': hdbscan_labels,
            'model': clusterer,
            'valid_indices': valid_indices
        }
        print(f"HDBSCAN found {len(set(hdbscan_labels)) - (1 if -1 in hdbscan_labels else 0)} clusters")
        print(f"Noise points: {sum(hdbscan_labels == -1)}")

    # PCA for visualization
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)
    results['pca'] = X_pca
    results['scaler'] = scaler
    results['feature_cols'] = feature_cols
    results['X'] = X

    print(f"K-means found {len(set(kmeans_labels))} clusters")

    return results

def visualize_clusters(features, df, results):
    """Create comprehensive visualizations."""
    print("\nCreating visualizations...")

    X = results['X']
    X_pca = results['pca']
    valid_indices = results['kmeans']['valid_indices']

    # Get valid features
    valid_features = features.loc[valid_indices].copy()
    valid_df = df.loc[valid_indices].copy()

    # Add cluster labels
    valid_features['kmeans_cluster'] = results['kmeans']['labels']
    if 'hdbscan' in results:
        valid_features['hdbscan_cluster'] = results['hdbscan']['labels']

    # 1. PCA visualization with k-means clusters
    plt.figure(figsize=(12, 8))
    scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1],
                         c=results['kmeans']['labels'],
                         cmap='tab10', alpha=0.6, s=20)
    plt.colorbar(scatter, label='Cluster')
    plt.xlabel('First Principal Component')
    plt.ylabel('Second Principal Component')
    plt.title('K-means Clusters (k=6) in PCA Space')
    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/clusters_pca_kmeans.png', dpi=150)
    print(f"Saved: {OUTPUT_DIR}/clusters_pca_kmeans.png")

    # 2. Feature distributions per cluster
    fig, axes = plt.subplots(4, 4, figsize=(16, 12))
    axes = axes.flatten()

    key_features = ['years_in_top100', 'peak_rank', 'peak_decade_idx', 'entry_rank',
                    'exit_rank', 'volatility', 'longest_run', 'num_gaps',
                    'trajectory', 'recent_presence', 'early_presence', 'ever_top10',
                    'ever_top20', 'rank_range', 'first_decade_idx', 'last_decade_idx']

    for idx, feature in enumerate(key_features):
        if idx < len(axes):
            for cluster in range(6):
                cluster_data = valid_features[valid_features['kmeans_cluster'] == cluster][feature]
                axes[idx].hist(cluster_data, alpha=0.5, label=f'C{cluster}', bins=20)
            axes[idx].set_title(feature, fontsize=10)
            axes[idx].set_xlabel('')
            if idx == 0:
                axes[idx].legend(fontsize=8)

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/feature_distributions.png', dpi=150)
    print(f"Saved: {OUTPUT_DIR}/feature_distributions.png")

    # 3. Example trajectories per cluster
    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    axes = axes.flatten()

    for cluster in range(6):
        cluster_names = valid_features[valid_features['kmeans_cluster'] == cluster]
        # Sample 10 random names from cluster
        sample_size = min(10, len(cluster_names))
        sample_names = cluster_names.sample(n=sample_size, random_state=42)

        for idx in sample_names.index:
            name = valid_features.loc[idx, 'name']
            gender = valid_features.loc[idx, 'gender']
            ranks = [valid_df.loc[idx, d] for d in DECADES]

            # Plot with x markers where rank is NaN
            x_positions = range(len(DECADES))
            y_values = []
            for r in ranks:
                if pd.isna(r):
                    y_values.append(None)
                else:
                    y_values.append(r)

            axes[cluster].plot(x_positions, y_values, alpha=0.6, linewidth=1)

        axes[cluster].set_title(f'Cluster {cluster} (n={len(cluster_names)})', fontsize=12)
        axes[cluster].set_xlabel('Decade')
        axes[cluster].set_ylabel('Rank (lower is better)')
        axes[cluster].set_xticks(range(len(DECADES)))
        axes[cluster].set_xticklabels([d[:4] for d in DECADES], rotation=45, fontsize=8)
        axes[cluster].invert_yaxis()
        axes[cluster].set_ylim(100, 0)
        axes[cluster].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/trajectory_examples.png', dpi=150)
    print(f"Saved: {OUTPUT_DIR}/trajectory_examples.png")

    # 4. Cluster summary statistics
    summary_stats = []
    for cluster in range(6):
        cluster_data = valid_features[valid_features['kmeans_cluster'] == cluster]
        stats = {
            'Cluster': cluster,
            'Count': len(cluster_data),
            'Avg Years in Top 100': cluster_data['years_in_top100'].mean(),
            'Avg Peak Rank': cluster_data['peak_rank'].mean(),
            'Avg Peak Decade': cluster_data['peak_decade_idx'].mean(),
            'Avg Longest Run': cluster_data['longest_run'].mean(),
            '% Recent Presence': cluster_data['recent_presence'].mean() * 100,
            '% Early Presence': cluster_data['early_presence'].mean() * 100,
            '% Ever Top 10': cluster_data['ever_top10'].mean() * 100,
        }
        summary_stats.append(stats)

    summary_df = pd.DataFrame(summary_stats)
    print("\nCluster Summary Statistics:")
    print(summary_df.to_string(index=False))

    summary_df.to_csv(f'{OUTPUT_DIR}/cluster_summary.csv', index=False)
    print(f"\nSaved: {OUTPUT_DIR}/cluster_summary.csv")

    return valid_features

def identify_archetypes(valid_features, df):
    """Identify and label cluster archetypes."""
    print("\nIdentifying archetypes...")

    archetypes = {}

    for cluster in range(6):
        cluster_data = valid_features[valid_features['kmeans_cluster'] == cluster]

        # Calculate key statistics
        avg_years = cluster_data['years_in_top100'].mean()
        avg_peak = cluster_data['peak_rank'].mean()
        avg_peak_decade = cluster_data['peak_decade_idx'].mean()
        avg_first_decade = cluster_data['first_decade_idx'].mean()
        avg_last_decade = cluster_data['last_decade_idx'].mean()
        pct_recent = cluster_data['recent_presence'].mean()
        pct_early = cluster_data['early_presence'].mean()
        avg_trajectory = cluster_data['trajectory'].mean()
        avg_longest_run = cluster_data['longest_run'].mean()
        pct_top10 = cluster_data['ever_top10'].mean()

        # Archetype identification logic
        archetype = "Unknown"
        description = ""

        if avg_years <= 2 and avg_longest_run <= 2:
            archetype = "One-Hit Wonder"
            description = "Brief appearance in top 100, typically 1-2 decades"
        elif avg_years >= 8 and avg_longest_run >= 7 and avg_peak <= 30:
            archetype = "Steady Classic"
            description = "Long-term presence with high rankings"
        elif pct_recent > 0.8 and avg_first_decade >= 8:
            archetype = "Recent Entrant"
            description = "New to top 100, emerged in 2000s or later"
        elif pct_early > 0.8 and pct_recent < 0.2:
            archetype = "Lost Generation"
            description = "Popular in early decades, no longer in top 100"
        elif avg_trajectory < -2:
            archetype = "Rising Star"
            description = "Improving rank over time (moving up)"
        elif avg_trajectory > 2:
            archetype = "Declining Former Favorite"
            description = "Worsening rank over time (moving down)"
        elif avg_years >= 5 and pct_top10 > 0.5:
            archetype = "Peak and Fade"
            description = "Reached top 10 but variable presence"
        else:
            archetype = "Intermittent Presence"
            description = "Sporadic appearances with gaps"

        archetypes[cluster] = {
            'name': archetype,
            'description': description,
            'count': len(cluster_data),
            'avg_years_in_top100': avg_years,
            'avg_peak_rank': avg_peak,
            'pct_recent': pct_recent * 100,
            'pct_early': pct_early * 100
        }

        # Get example names
        top_examples = cluster_data.nsmallest(5, 'peak_rank')
        archetypes[cluster]['examples'] = list(zip(
            top_examples['name'].values,
            top_examples['gender'].values,
            top_examples['peak_rank'].values
        ))

    # Print archetype summary
    print("\n" + "="*80)
    print("CLUSTER ARCHETYPES")
    print("="*80)

    for cluster, info in archetypes.items():
        print(f"\nCluster {cluster}: {info['name']}")
        print(f"  {info['description']}")
        print(f"  Count: {info['count']} names")
        print(f"  Avg years in top 100: {info['avg_years_in_top100']:.1f}")
        print(f"  Avg peak rank: {info['avg_peak_rank']:.1f}")
        print(f"  Recent presence: {info['pct_recent']:.1f}%")
        print(f"  Early presence: {info['pct_early']:.1f}%")
        print(f"  Top examples:")
        for name, gender, peak in info['examples']:
            print(f"    - {name} ({gender}) - peak rank {peak:.0f}")

    # Save archetypes to file
    archetype_df = pd.DataFrame([
        {
            'Cluster': cluster,
            'Archetype': info['name'],
            'Description': info['description'],
            'Count': info['count'],
            'Avg Years': f"{info['avg_years_in_top100']:.1f}",
            'Avg Peak': f"{info['avg_peak_rank']:.1f}",
            '% Recent': f"{info['pct_recent']:.1f}",
            '% Early': f"{info['pct_early']:.1f}"
        }
        for cluster, info in archetypes.items()
    ])

    archetype_df.to_csv(f'{OUTPUT_DIR}/archetypes.csv', index=False)
    print(f"\nSaved: {OUTPUT_DIR}/archetypes.csv")

    # Create name-to-archetype mapping
    cluster_to_archetype = {cluster: info['name'] for cluster, info in archetypes.items()}
    valid_features['archetype'] = valid_features['kmeans_cluster'].map(cluster_to_archetype)

    # Save name assignments
    name_assignments = valid_features[['name', 'gender', 'archetype']].copy()
    name_assignments.to_csv(f'{OUTPUT_DIR}/name_archetypes.csv', index=False)
    print(f"Saved: {OUTPUT_DIR}/name_archetypes.csv")

    return archetypes, valid_features

def update_csv_with_archetypes(valid_features):
    """Update the CSV file with archetype labels."""
    print("\nUpdating CSV with archetype labels...")

    # Read the original CSV
    df = pd.read_csv(INPUT_FILE)

    # Create a mapping from name|gender to archetype
    archetype_map = {}
    for idx, row in valid_features.iterrows():
        key = f"{row['name']}|{row['gender']}"
        archetype_map[key] = row['archetype']

    # Add archetype column
    df['Archetype'] = df['name|gender'].map(archetype_map)

    # Fill NaN with empty string for names not clustered
    df['Archetype'] = df['Archetype'].fillna('')

    # Save updated CSV
    df.to_csv(INPUT_FILE, index=False)

    clustered_count = df['Archetype'].ne('').sum()
    print(f"  Added archetypes for {clustered_count} names")
    print(f"  {len(df) - clustered_count} names left uncategorized (insufficient data)")

def main():
    """Main execution."""
    print("="*80)
    print("HISTORIC RANK TIME SERIES FEATURE ANALYSIS")
    print("="*80)

    # Load data
    df = load_data()

    # Engineer features
    features, df = engineer_features(df)

    # Perform clustering
    results = perform_clustering(features)

    # Visualize clusters
    valid_features = visualize_clusters(features, df, results)

    # Identify archetypes
    archetypes, valid_features = identify_archetypes(valid_features, df)

    # Update CSV with archetypes
    update_csv_with_archetypes(valid_features)

    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)
    print(f"\nOutput files saved to: {OUTPUT_DIR}/")
    print("  - clusters_pca_kmeans.png")
    print("  - feature_distributions.png")
    print("  - trajectory_examples.png")
    print("  - cluster_summary.csv")
    print("  - archetypes.csv")
    print("  - name_archetypes.csv")
    print(f"\nUpdated: {INPUT_FILE} (added Archetype column)")

if __name__ == '__main__':
    main()
