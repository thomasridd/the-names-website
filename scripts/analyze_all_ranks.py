#!/usr/bin/env python3
"""
Comprehensive time series analysis of baby name rankings.
Creates features from sparse data and performs clustering to identify archetypes.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# For clustering
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
try:
    import hdbscan
    HDBSCAN_AVAILABLE = True
except ImportError:
    HDBSCAN_AVAILABLE = False
    print("Warning: HDBSCAN not available. Install with: pip install hdbscan")

# Set up paths
DATA_PATH = Path(__file__).parent.parent / 'data' / 'all_ranks.csv'
OUTPUT_DIR = Path(__file__).parent.parent / 'analysis_output' / 'all_ranks'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Matplotlib settings
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")


def load_and_prepare_data():
    """Load the CSV and convert ranks to numeric (x -> NaN)."""
    print("Loading data from all_ranks.csv...")
    df = pd.read_csv(DATA_PATH)

    # Get year columns
    year_cols = [col for col in df.columns if col != 'name']

    # Convert 'x' to NaN and convert to numeric
    for col in year_cols:
        df[col] = pd.to_numeric(df[col].replace('x', np.nan), errors='coerce')

    print(f"Loaded {len(df)} names with {len(year_cols)} time periods")
    return df, year_cols


def extract_features(df, year_cols):
    """Extract meaningful features from time series data."""
    print("\nExtracting features...")

    features = pd.DataFrame()
    features['name'] = df['name']

    # Separate decade columns (1904-1994) and yearly columns (1996-2024)
    decade_cols = [col for col in year_cols if int(col) <= 1994]
    yearly_cols = [col for col in year_cols if int(col) >= 1996]
    recent_5yr_cols = [col for col in year_cols if int(col) >= 2020]

    # 1. Years in top 100 (overall)
    features['years_in_top100'] = df[year_cols].notna().sum(axis=1)

    # 2. Years in top 10
    features['years_in_top10'] = (df[year_cols] <= 10).sum(axis=1)

    # 3. Years in top 100 within last 5 years (2020-2024)
    features['recent_5yr_in_top100'] = df[recent_5yr_cols].notna().sum(axis=1)

    # 4. Peak ranking and year achieved
    def get_peak_info(row):
        valid_ranks = row[year_cols].dropna()
        if len(valid_ranks) == 0:
            return np.nan, np.nan
        peak_rank = valid_ranks.min()
        peak_year = int(valid_ranks.idxmin())
        return peak_rank, peak_year

    peak_info = df.apply(get_peak_info, axis=1)
    features['peak_rank'] = peak_info.apply(lambda x: x[0])
    features['peak_year'] = peak_info.apply(lambda x: x[1])

    # 5. First appearance year and initial rank
    def get_first_appearance(row):
        for col in year_cols:
            if pd.notna(row[col]):
                return int(col), row[col]
        return np.nan, np.nan

    first_app = df.apply(get_first_appearance, axis=1)
    features['first_year'] = first_app.apply(lambda x: x[0])
    features['first_rank'] = first_app.apply(lambda x: x[1])

    # 6. Last appearance year and final rank
    def get_last_appearance(row):
        for col in reversed(year_cols):
            if pd.notna(row[col]):
                return int(col), row[col]
        return np.nan, np.nan

    last_app = df.apply(get_last_appearance, axis=1)
    features['last_year'] = last_app.apply(lambda x: x[0])
    features['last_rank'] = last_app.apply(lambda x: x[1])

    # 7. Entry pattern: Did it debut high or climb?
    features['debut_high'] = (features['first_rank'] <= 20).astype(int)
    features['improved_from_debut'] = (features['peak_rank'] < features['first_rank']).astype(int)

    # 8. Volatility/stability when present (std of ranks when ranked)
    def calculate_volatility(row):
        valid_ranks = row[year_cols].dropna()
        if len(valid_ranks) < 2:
            return np.nan
        return valid_ranks.std()

    features['rank_volatility'] = df.apply(calculate_volatility, axis=1)

    # 9. Length of longest continuous run
    def longest_continuous_run(row):
        max_run = 0
        current_run = 0
        for col in year_cols:
            if pd.notna(row[col]):
                current_run += 1
                max_run = max(max_run, current_run)
            else:
                current_run = 0
        return max_run

    features['longest_run'] = df.apply(longest_continuous_run, axis=1)

    # 10. Currently active (ranked in 2024)?
    features['active_2024'] = df['2024'].notna().astype(int)

    # 11. Trend in recent years (slope of last 10 years of data)
    def calculate_recent_trend(row):
        recent_data = row[yearly_cols[-10:]].dropna()
        if len(recent_data) < 3:
            return np.nan
        x = np.arange(len(recent_data))
        y = recent_data.values.astype(float)
        # Negative slope = improving rank (getting smaller)
        slope = np.polyfit(x, y, 1)[0]
        return slope

    features['recent_trend'] = df.apply(calculate_recent_trend, axis=1)

    # 12. Average rank when present
    features['avg_rank_when_present'] = df[year_cols].mean(axis=1)

    # 13. Decade vs modern presence
    features['decades_present'] = df[decade_cols].notna().sum(axis=1)
    features['modern_years_present'] = df[yearly_cols].notna().sum(axis=1)

    # 14. Recency score (weighted by how recent appearances are)
    def calculate_recency(row):
        total_weight = 0
        for i, col in enumerate(year_cols):
            if pd.notna(row[col]):
                # More recent years get higher weight
                total_weight += i + 1
        return total_weight / len(year_cols) if total_weight > 0 else 0

    features['recency_score'] = df.apply(calculate_recency, axis=1)

    print(f"Extracted {len(features.columns) - 1} features")
    return features


def prepare_for_clustering(features):
    """Prepare features for clustering by handling missing values and scaling."""
    print("\nPreparing features for clustering...")

    # Select numeric features for clustering (exclude name and year identifiers)
    cluster_features = features.drop(['name', 'peak_year', 'first_year', 'last_year'], axis=1)

    # Fill NaN values with -1 (to distinguish from 0)
    cluster_features_filled = cluster_features.fillna(-1)

    # Standardize features
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(cluster_features_filled)

    return features_scaled, cluster_features.columns.tolist()


def perform_clustering(features_scaled, features, n_clusters=8):
    """Perform both k-means and HDBSCAN clustering."""
    print(f"\nPerforming clustering with k={n_clusters}...")

    # K-Means clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    features['kmeans_cluster'] = kmeans.fit_predict(features_scaled)

    # HDBSCAN clustering (if available)
    if HDBSCAN_AVAILABLE:
        clusterer = hdbscan.HDBSCAN(min_cluster_size=100, min_samples=10)
        features['hdbscan_cluster'] = clusterer.fit_predict(features_scaled)
        print(f"HDBSCAN found {features['hdbscan_cluster'].max() + 1} clusters")
    else:
        features['hdbscan_cluster'] = -1

    print(f"K-Means created {n_clusters} clusters")
    return features


def identify_archetypes(features):
    """Identify and label archetypes based on feature patterns."""
    print("\nIdentifying archetypes...")

    features['archetype'] = 'Unknown'

    # One-hit wonder: appears briefly, low volatility, short run
    mask = (
        (features['years_in_top100'] <= 5) &
        (features['longest_run'] <= 3) &
        (features['peak_rank'] <= 50)
    )
    features.loc[mask, 'archetype'] = 'One-Hit Wonder'

    # Steady classic: long presence, low volatility, high average
    mask = (
        (features['years_in_top100'] >= 20) &
        (features['rank_volatility'] <= 15) &
        (features['avg_rank_when_present'] <= 50)
    )
    features.loc[mask, 'archetype'] = 'Steady Classic'

    # Recent entrant: first appeared after 2000, currently active
    mask = (
        (features['first_year'] >= 2000) &
        (features['active_2024'] == 1) &
        (features['recent_5yr_in_top100'] >= 3)
    )
    features.loc[mask, 'archetype'] = 'Recent Entrant'

    # Declining former favorite: peaked early, declining trend
    mask = (
        (features['peak_year'] <= 1980) &
        (features['peak_rank'] <= 20) &
        (features['recent_trend'] > 5) &  # Getting worse (rank increasing)
        (features['active_2024'] == 0)
    )
    features.loc[mask, 'archetype'] = 'Declining Former Favorite'

    # Rising star: improving from debut, positive recent trend
    mask = (
        (features['improved_from_debut'] == 1) &
        (features['recent_trend'] < -5) &  # Getting better (rank decreasing)
        (features['active_2024'] == 1) &
        (features['first_year'] >= 1996)
    )
    features.loc[mask, 'archetype'] = 'Rising Star'

    # Comeback kid: gap in presence, recently returned
    mask = (
        (features['years_in_top100'] >= 10) &
        (features['longest_run'] < features['years_in_top100']) &
        (features['recent_5yr_in_top100'] >= 3) &
        (features['first_year'] <= 1990)
    )
    features.loc[mask, 'archetype'] = 'Comeback Kid'

    # Flash in the pan: short intense popularity
    mask = (
        (features['peak_rank'] <= 10) &
        (features['years_in_top100'] <= 10) &
        (features['active_2024'] == 0)
    )
    features.loc[mask, 'archetype'] = 'Flash in the Pan'

    # Century classic: present across many decades
    mask = (
        (features['decades_present'] >= 7) &
        (features['years_in_top100'] >= 25)
    )
    features.loc[mask, 'archetype'] = 'Century Classic'

    print("\nArchetype distribution:")
    print(features['archetype'].value_counts())

    return features


def create_visualizations(features, df, year_cols):
    """Create comprehensive visualizations."""
    print("\nCreating visualizations...")

    # 1. Cluster feature distributions
    fig, axes = plt.subplots(3, 3, figsize=(15, 12))
    fig.suptitle('Feature Distributions by K-Means Cluster', fontsize=16)

    key_features = [
        'years_in_top100', 'years_in_top10', 'peak_rank',
        'rank_volatility', 'longest_run', 'recent_trend',
        'recency_score', 'avg_rank_when_present', 'recent_5yr_in_top100'
    ]

    for idx, feature in enumerate(key_features):
        ax = axes[idx // 3, idx % 3]
        for cluster in sorted(features['kmeans_cluster'].unique()):
            data = features[features['kmeans_cluster'] == cluster][feature].dropna()
            ax.hist(data, alpha=0.5, label=f'Cluster {cluster}', bins=20)
        ax.set_title(feature)
        ax.set_xlabel('Value')
        ax.set_ylabel('Count')
        if idx == 0:
            ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=8)

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'cluster_feature_distributions.png', dpi=300, bbox_inches='tight')
    print("Saved: cluster_feature_distributions.png")
    plt.close()

    # 2. Example trajectories per cluster
    n_examples = 3
    clusters = sorted(features['kmeans_cluster'].unique())

    fig, axes = plt.subplots(len(clusters), 1, figsize=(14, 3 * len(clusters)))
    if len(clusters) == 1:
        axes = [axes]

    for cluster_idx, cluster in enumerate(clusters):
        ax = axes[cluster_idx]
        cluster_names = features[features['kmeans_cluster'] == cluster].head(n_examples)['name'].values

        for name in cluster_names:
            name_data = df[df['name'] == name].iloc[0]
            years = [int(col) for col in year_cols]
            ranks = [name_data[col] if pd.notna(name_data[col]) else None for col in year_cols]

            # Plot with gaps for missing data
            x_plot = []
            y_plot = []
            for year, rank in zip(years, ranks):
                if rank is not None:
                    x_plot.append(year)
                    y_plot.append(rank)

            ax.plot(x_plot, y_plot, marker='o', markersize=3, label=name, linewidth=1.5)

        ax.set_title(f'Cluster {cluster} - Example Trajectories')
        ax.set_xlabel('Year')
        ax.set_ylabel('Rank (lower is better)')
        ax.invert_yaxis()
        ax.legend()
        ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'cluster_trajectories.png', dpi=300, bbox_inches='tight')
    print("Saved: cluster_trajectories.png")
    plt.close()

    # 3. Archetype distribution
    fig, ax = plt.subplots(figsize=(10, 6))
    archetype_counts = features['archetype'].value_counts()
    archetype_counts.plot(kind='barh', ax=ax)
    ax.set_title('Distribution of Name Archetypes', fontsize=14)
    ax.set_xlabel('Count')
    ax.set_ylabel('Archetype')
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'archetype_distribution.png', dpi=300, bbox_inches='tight')
    print("Saved: archetype_distribution.png")
    plt.close()

    # 4. Archetype example trajectories
    archetypes = features['archetype'].value_counts().head(8).index.tolist()

    fig, axes = plt.subplots(len(archetypes), 1, figsize=(14, 3 * len(archetypes)))
    if len(archetypes) == 1:
        axes = [axes]

    for arch_idx, archetype in enumerate(archetypes):
        if archetype == 'Unknown':
            continue

        ax = axes[arch_idx]
        archetype_names = features[features['archetype'] == archetype].head(n_examples)['name'].values

        for name in archetype_names:
            name_data = df[df['name'] == name].iloc[0]
            years = [int(col) for col in year_cols]
            ranks = [name_data[col] if pd.notna(name_data[col]) else None for col in year_cols]

            x_plot = []
            y_plot = []
            for year, rank in zip(years, ranks):
                if rank is not None:
                    x_plot.append(year)
                    y_plot.append(rank)

            if len(x_plot) > 0:
                ax.plot(x_plot, y_plot, marker='o', markersize=3, label=name, linewidth=1.5)

        ax.set_title(f'{archetype} - Example Trajectories')
        ax.set_xlabel('Year')
        ax.set_ylabel('Rank (lower is better)')
        ax.invert_yaxis()
        ax.legend()
        ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'archetype_trajectories.png', dpi=300, bbox_inches='tight')
    print("Saved: archetype_trajectories.png")
    plt.close()

    # 5. Cluster interpretations heatmap
    fig, ax = plt.subplots(figsize=(12, 8))

    cluster_summaries = features.groupby('kmeans_cluster')[key_features].mean()

    sns.heatmap(cluster_summaries.T, annot=True, fmt='.1f', cmap='YlOrRd', ax=ax)
    ax.set_title('Cluster Characteristics (Mean Feature Values)', fontsize=14)
    ax.set_xlabel('Cluster')
    ax.set_ylabel('Feature')
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'cluster_heatmap.png', dpi=300, bbox_inches='tight')
    print("Saved: cluster_heatmap.png")
    plt.close()


def save_results(features):
    """Save feature data and cluster assignments."""
    print("\nSaving results...")

    # Save full features with clusters
    features.to_csv(OUTPUT_DIR / 'features_with_clusters.csv', index=False)
    print(f"Saved: features_with_clusters.csv ({len(features)} rows)")

    # Save cluster summaries
    cluster_summary = features.groupby('kmeans_cluster').agg({
        'name': 'count',
        'years_in_top100': 'mean',
        'years_in_top10': 'mean',
        'peak_rank': 'mean',
        'rank_volatility': 'mean',
        'longest_run': 'mean',
        'recency_score': 'mean'
    }).round(2)
    cluster_summary.columns = ['count', 'avg_years_top100', 'avg_years_top10',
                                'avg_peak_rank', 'avg_volatility', 'avg_longest_run',
                                'avg_recency']
    cluster_summary.to_csv(OUTPUT_DIR / 'cluster_summary.csv')
    print("Saved: cluster_summary.csv")

    # Save archetype summary
    archetype_summary = features.groupby('archetype').agg({
        'name': 'count',
        'years_in_top100': 'mean',
        'peak_rank': 'mean',
        'first_year': 'mean',
        'last_year': 'mean'
    }).round(2)
    archetype_summary.columns = ['count', 'avg_years_top100', 'avg_peak_rank',
                                  'avg_first_year', 'avg_last_year']
    archetype_summary.to_csv(OUTPUT_DIR / 'archetype_summary.csv')
    print("Saved: archetype_summary.csv")

    # Save example names per archetype
    with open(OUTPUT_DIR / 'archetype_examples.txt', 'w') as f:
        for archetype in features['archetype'].unique():
            if archetype == 'Unknown':
                continue
            f.write(f"\n{archetype}:\n")
            examples = features[features['archetype'] == archetype].head(10)['name'].tolist()
            f.write(", ".join(examples) + "\n")
    print("Saved: archetype_examples.txt")


def main():
    """Main execution function."""
    print("="*60)
    print("BABY NAME TIME SERIES ANALYSIS")
    print("="*60)

    # Load data
    df, year_cols = load_and_prepare_data()

    # Extract features
    features = extract_features(df, year_cols)

    # Prepare for clustering
    features_scaled, feature_names = prepare_for_clustering(features)

    # Perform clustering
    features = perform_clustering(features_scaled, features, n_clusters=8)

    # Identify archetypes
    features = identify_archetypes(features)

    # Create visualizations
    create_visualizations(features, df, year_cols)

    # Save results
    save_results(features)

    print("\n" + "="*60)
    print("ANALYSIS COMPLETE!")
    print(f"Results saved to: {OUTPUT_DIR}")
    print("="*60)


if __name__ == '__main__':
    main()
