#!/usr/bin/env python3
"""
Time series analysis of baby name rankings using only the last 5 years (2020-2024).
Creates features from recent data and performs clustering to identify current trends.
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
OUTPUT_DIR = Path(__file__).parent.parent / 'analysis_output' / 'since_2020'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Matplotlib settings
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# Years to analyze
RECENT_YEARS = ['2020', '2021', '2022', '2023', '2024']


def load_and_prepare_data():
    """Load the CSV and extract only the last 5 years of data."""
    print("Loading data from all_ranks.csv...")
    df = pd.read_csv(DATA_PATH)

    # Keep name column and only recent years
    df_recent = df[['name'] + RECENT_YEARS].copy()

    # Convert 'x' to NaN and convert to numeric
    for col in RECENT_YEARS:
        df_recent[col] = pd.to_numeric(df_recent[col].replace('x', np.nan), errors='coerce')

    print(f"Loaded {len(df_recent)} names with {len(RECENT_YEARS)} years (2020-2024)")
    return df_recent


def extract_features(df):
    """Extract meaningful features from 5-year time series data."""
    print("\nExtracting features from 2020-2024 data...")

    features = pd.DataFrame()
    features['name'] = df['name']

    # 1. Years present (out of 5)
    features['years_present'] = df[RECENT_YEARS].notna().sum(axis=1)

    # 2. Years in top 10
    features['years_in_top10'] = (df[RECENT_YEARS] <= 10).sum(axis=1)

    # 3. Years in top 20
    features['years_in_top20'] = (df[RECENT_YEARS] <= 20).sum(axis=1)

    # 4. Years in top 50
    features['years_in_top50'] = (df[RECENT_YEARS] <= 50).sum(axis=1)

    # 5. Years in top 100
    features['years_in_top100'] = (df[RECENT_YEARS] <= 100).sum(axis=1)

    # 6. Peak ranking and year achieved
    def get_peak_info(row):
        valid_ranks = row[RECENT_YEARS].dropna()
        if len(valid_ranks) == 0:
            return np.nan, np.nan
        peak_rank = valid_ranks.min()
        peak_year = int(valid_ranks.idxmin())
        return peak_rank, peak_year

    peak_info = df.apply(get_peak_info, axis=1)
    features['peak_rank'] = peak_info.apply(lambda x: x[0])
    features['peak_year'] = peak_info.apply(lambda x: x[1])

    # 7. First appearance year and initial rank
    def get_first_appearance(row):
        for col in RECENT_YEARS:
            if pd.notna(row[col]):
                return int(col), row[col]
        return np.nan, np.nan

    first_app = df.apply(get_first_appearance, axis=1)
    features['first_year'] = first_app.apply(lambda x: x[0])
    features['first_rank'] = first_app.apply(lambda x: x[1])

    # 8. Last appearance year and final rank (2024 in most cases)
    def get_last_appearance(row):
        for col in reversed(RECENT_YEARS):
            if pd.notna(row[col]):
                return int(col), row[col]
        return np.nan, np.nan

    last_app = df.apply(get_last_appearance, axis=1)
    features['last_year'] = last_app.apply(lambda x: x[0])
    features['last_rank'] = last_app.apply(lambda x: x[1])

    # 9. Current rank (2024)
    features['rank_2024'] = df['2024']
    features['active_2024'] = df['2024'].notna().astype(int)

    # 10. Rank in 2020
    features['rank_2020'] = df['2020']

    # 11. Change from 2020 to 2024 (negative = improving)
    features['change_2020_to_2024'] = df['2024'] - df['2020']

    # 12. Improved from debut
    features['improved_from_debut'] = (features['peak_rank'] < features['first_rank']).astype(int)

    # 13. Volatility (std of ranks when present)
    def calculate_volatility(row):
        valid_ranks = row[RECENT_YEARS].dropna()
        if len(valid_ranks) < 2:
            return np.nan
        return valid_ranks.std()

    features['rank_volatility'] = df.apply(calculate_volatility, axis=1)

    # 14. Trend (slope over available years)
    def calculate_trend(row):
        recent_data = row[RECENT_YEARS].dropna()
        if len(recent_data) < 2:
            return np.nan
        x = np.arange(len(recent_data))
        y = recent_data.values.astype(float)
        # Negative slope = improving rank (getting smaller)
        slope = np.polyfit(x, y, 1)[0]
        return slope

    features['trend_slope'] = df.apply(calculate_trend, axis=1)

    # 15. Average rank when present
    features['avg_rank'] = df[RECENT_YEARS].mean(axis=1)

    # 16. Continuous presence (all 5 years)
    features['continuous_5yr'] = (features['years_present'] == 5).astype(int)

    # 17. New in period (first appeared 2020-2024)
    features['new_in_period'] = features['first_year'].notna().astype(int)

    # 18. Entered recently (2022-2024)
    features['recent_entry'] = ((features['first_year'] >= 2022) & (features['first_year'].notna())).astype(int)

    # 19. Exited (was present but not in 2024)
    features['exited'] = ((features['years_present'] > 0) & (features['active_2024'] == 0)).astype(int)

    # 20. Trajectory category
    def categorize_trajectory(row):
        if row['years_present'] < 2:
            return 'sparse'
        if pd.isna(row['trend_slope']):
            return 'unknown'
        if row['trend_slope'] < -10:
            return 'strongly_rising'
        elif row['trend_slope'] < -2:
            return 'rising'
        elif row['trend_slope'] > 10:
            return 'strongly_declining'
        elif row['trend_slope'] > 2:
            return 'declining'
        else:
            return 'stable'

    features['trajectory'] = features.apply(categorize_trajectory, axis=1)

    print(f"Extracted {len(features.columns) - 1} features")
    return features


def prepare_for_clustering(features):
    """Prepare features for clustering by handling missing values and scaling."""
    print("\nPreparing features for clustering...")

    # Select numeric features for clustering
    cluster_features = features.drop(['name', 'peak_year', 'first_year', 'last_year',
                                       'rank_2024', 'rank_2020', 'trajectory'], axis=1)

    # Fill NaN values with -1
    cluster_features_filled = cluster_features.fillna(-1)

    # Standardize features
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(cluster_features_filled)

    return features_scaled, cluster_features.columns.tolist()


def perform_clustering(features_scaled, features, n_clusters=6):
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
    """Identify and label archetypes based on 5-year patterns."""
    print("\nIdentifying archetypes...")

    features['archetype'] = 'Unknown'

    # Dominant force: In top 10 for all or most years
    mask = (features['years_in_top10'] >= 4) & (features['active_2024'] == 1)
    features.loc[mask, 'archetype'] = 'Dominant Force'

    # Rising star: Strong upward trend, active in 2024
    mask = (
        (features['trend_slope'] < -5) &
        (features['active_2024'] == 1) &
        (features['years_present'] >= 3)
    )
    features.loc[mask, 'archetype'] = 'Rising Star'

    # Steady performer: Present all 5 years, low volatility
    mask = (
        (features['continuous_5yr'] == 1) &
        (features['rank_volatility'] <= 10) &
        (features['avg_rank'] <= 100)
    )
    features.loc[mask, 'archetype'] = 'Steady Performer'

    # New entrant: First appeared 2022-2024, still active
    mask = (
        (features['recent_entry'] == 1) &
        (features['active_2024'] == 1)
    )
    features.loc[mask, 'archetype'] = 'New Entrant'

    # Fading: Declining trend, may have exited
    mask = (
        (features['trend_slope'] > 5) &
        (features['years_present'] >= 3)
    )
    features.loc[mask, 'archetype'] = 'Fading'

    # Volatile: High volatility, multiple swings
    mask = (
        (features['rank_volatility'] > 30) &
        (features['years_present'] >= 4)
    )
    features.loc[mask, 'archetype'] = 'Volatile'

    # One-hit wonder: Brief appearance (1-2 years)
    mask = (
        (features['years_present'] <= 2) &
        (features['years_present'] > 0) &
        (features['peak_rank'] <= 200)
    )
    features.loc[mask, 'archetype'] = 'One-Hit Wonder'

    # Top tier stable: Top 20 consistently
    mask = (
        (features['years_in_top20'] >= 4) &
        (features['rank_volatility'] <= 8)
    )
    features.loc[mask, 'archetype'] = 'Top Tier Stable'

    print("\nArchetype distribution:")
    print(features['archetype'].value_counts())

    return features


def create_visualizations(features, df):
    """Create comprehensive visualizations."""
    print("\nCreating visualizations...")

    # 1. Cluster feature distributions
    fig, axes = plt.subplots(3, 3, figsize=(15, 12))
    fig.suptitle('Feature Distributions by K-Means Cluster (2020-2024)', fontsize=16)

    key_features = [
        'years_present', 'years_in_top10', 'peak_rank',
        'rank_volatility', 'trend_slope', 'avg_rank',
        'change_2020_to_2024', 'years_in_top100', 'first_rank'
    ]

    for idx, feature in enumerate(key_features):
        ax = axes[idx // 3, idx % 3]
        for cluster in sorted(features['kmeans_cluster'].unique()):
            data = features[features['kmeans_cluster'] == cluster][feature].dropna()
            if len(data) > 0:
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
    n_examples = 5
    clusters = sorted(features['kmeans_cluster'].unique())

    fig, axes = plt.subplots(len(clusters), 1, figsize=(10, 3 * len(clusters)))
    if len(clusters) == 1:
        axes = [axes]

    for cluster_idx, cluster in enumerate(clusters):
        ax = axes[cluster_idx]
        cluster_data = features[features['kmeans_cluster'] == cluster]
        # Get names with complete data
        complete_names = cluster_data[cluster_data['years_present'] >= 3].head(n_examples)['name'].values

        for name in complete_names:
            name_data = df[df['name'] == name].iloc[0]
            years = [int(year) for year in RECENT_YEARS]
            ranks = [name_data[year_str] if pd.notna(name_data[year_str]) else None for year_str in RECENT_YEARS]

            x_plot = []
            y_plot = []
            for year, rank in zip(years, ranks):
                if rank is not None:
                    x_plot.append(year)
                    y_plot.append(rank)

            if len(x_plot) > 0:
                ax.plot(x_plot, y_plot, marker='o', markersize=5, label=name, linewidth=2)

        ax.set_title(f'Cluster {cluster} - Example Trajectories (2020-2024)')
        ax.set_xlabel('Year')
        ax.set_ylabel('Rank (lower is better)')
        ax.set_xticks(years)
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
    ax.set_title('Distribution of Name Archetypes (2020-2024)', fontsize=14)
    ax.set_xlabel('Count')
    ax.set_ylabel('Archetype')
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'archetype_distribution.png', dpi=300, bbox_inches='tight')
    print("Saved: archetype_distribution.png")
    plt.close()

    # 4. Archetype example trajectories
    archetypes = [a for a in features['archetype'].value_counts().head(8).index.tolist() if a != 'Unknown']

    if len(archetypes) > 0:
        fig, axes = plt.subplots(len(archetypes), 1, figsize=(10, 3 * len(archetypes)))
        if len(archetypes) == 1:
            axes = [axes]

        for arch_idx, archetype in enumerate(archetypes):
            ax = axes[arch_idx]
            archetype_data = features[features['archetype'] == archetype]
            archetype_names = archetype_data[archetype_data['years_present'] >= 3].head(n_examples)['name'].values

            for name in archetype_names:
                name_data = df[df['name'] == name].iloc[0]
                years = [int(year) for year in RECENT_YEARS]
                ranks = [name_data[year_str] if pd.notna(name_data[year_str]) else None for year_str in RECENT_YEARS]

                x_plot = []
                y_plot = []
                for year, rank in zip(years, ranks):
                    if rank is not None:
                        x_plot.append(year)
                        y_plot.append(rank)

                if len(x_plot) > 0:
                    ax.plot(x_plot, y_plot, marker='o', markersize=5, label=name, linewidth=2)

            ax.set_title(f'{archetype} - Example Trajectories (2020-2024)')
            ax.set_xlabel('Year')
            ax.set_ylabel('Rank (lower is better)')
            ax.set_xticks(years)
            ax.invert_yaxis()
            ax.legend()
            ax.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / 'archetype_trajectories.png', dpi=300, bbox_inches='tight')
        print("Saved: archetype_trajectories.png")
        plt.close()

    # 5. Cluster interpretations heatmap
    fig, ax = plt.subplots(figsize=(10, 8))

    cluster_summaries = features.groupby('kmeans_cluster')[key_features].mean()

    sns.heatmap(cluster_summaries.T, annot=True, fmt='.1f', cmap='YlOrRd', ax=ax)
    ax.set_title('Cluster Characteristics 2020-2024 (Mean Feature Values)', fontsize=14)
    ax.set_xlabel('Cluster')
    ax.set_ylabel('Feature')
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'cluster_heatmap.png', dpi=300, bbox_inches='tight')
    print("Saved: cluster_heatmap.png")
    plt.close()

    # 6. Trajectory distribution
    fig, ax = plt.subplots(figsize=(10, 6))
    trajectory_counts = features['trajectory'].value_counts()
    trajectory_counts.plot(kind='bar', ax=ax)
    ax.set_title('Trajectory Types (2020-2024)', fontsize=14)
    ax.set_xlabel('Trajectory')
    ax.set_ylabel('Count')
    ax.set_xticklabels(ax.get_xticklabels(), rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'trajectory_distribution.png', dpi=300, bbox_inches='tight')
    print("Saved: trajectory_distribution.png")
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
        'years_present': 'mean',
        'years_in_top10': 'mean',
        'peak_rank': 'mean',
        'rank_volatility': 'mean',
        'trend_slope': 'mean',
        'avg_rank': 'mean'
    }).round(2)
    cluster_summary.columns = ['count', 'avg_years_present', 'avg_years_top10',
                                'avg_peak_rank', 'avg_volatility', 'avg_trend_slope',
                                'avg_rank']
    cluster_summary.to_csv(OUTPUT_DIR / 'cluster_summary.csv')
    print("Saved: cluster_summary.csv")

    # Save archetype summary
    archetype_summary = features.groupby('archetype').agg({
        'name': 'count',
        'years_present': 'mean',
        'peak_rank': 'mean',
        'trend_slope': 'mean',
        'avg_rank': 'mean'
    }).round(2)
    archetype_summary.columns = ['count', 'avg_years_present', 'avg_peak_rank',
                                  'avg_trend_slope', 'avg_rank']
    archetype_summary.to_csv(OUTPUT_DIR / 'archetype_summary.csv')
    print("Saved: archetype_summary.csv")

    # Save trajectory summary
    trajectory_summary = features.groupby('trajectory').agg({
        'name': 'count',
        'years_present': 'mean',
        'peak_rank': 'mean',
        'trend_slope': 'mean'
    }).round(2)
    trajectory_summary.to_csv(OUTPUT_DIR / 'trajectory_summary.csv')
    print("Saved: trajectory_summary.csv")

    # Save example names per archetype
    with open(OUTPUT_DIR / 'archetype_examples.txt', 'w') as f:
        for archetype in features['archetype'].unique():
            if archetype == 'Unknown':
                continue
            f.write(f"\n{archetype}:\n")
            examples = features[features['archetype'] == archetype].head(15)['name'].tolist()
            f.write(", ".join(examples) + "\n")
    print("Saved: archetype_examples.txt")

    # Save top rising and falling names
    with open(OUTPUT_DIR / 'notable_names.txt', 'w') as f:
        f.write("TOP 20 RISING NAMES (2020-2024)\n")
        f.write("="*50 + "\n\n")
        rising = features[features['active_2024'] == 1].dropna(subset=['trend_slope']).nsmallest(20, 'trend_slope')
        for idx, row in rising.iterrows():
            slope_str = f"{row['trend_slope']:.1f}" if pd.notna(row['trend_slope']) else 'N/A'
            rank_2020 = f"{row['rank_2020']:.0f}" if pd.notna(row['rank_2020']) else 'N/A'
            rank_2024 = f"{row['rank_2024']:.0f}" if pd.notna(row['rank_2024']) else 'N/A'
            f.write(f"{row['name']}: slope={slope_str}, 2020 rank={rank_2020}, 2024 rank={rank_2024}\n")

        f.write("\n\nTOP 20 FALLING NAMES (2020-2024)\n")
        f.write("="*50 + "\n\n")
        falling = features[features['years_present'] >= 3].dropna(subset=['trend_slope']).nlargest(20, 'trend_slope')
        for idx, row in falling.iterrows():
            slope_str = f"{row['trend_slope']:.1f}" if pd.notna(row['trend_slope']) else 'N/A'
            rank_2020 = f"{row['rank_2020']:.0f}" if pd.notna(row['rank_2020']) else 'N/A'
            rank_2024 = f"{row['rank_2024']:.0f}" if pd.notna(row['rank_2024']) else 'N/A'
            f.write(f"{row['name']}: slope={slope_str}, 2020 rank={rank_2020}, 2024 rank={rank_2024}\n")
    print("Saved: notable_names.txt")


def main():
    """Main execution function."""
    print("="*60)
    print("BABY NAME RECENT TRENDS ANALYSIS (2020-2024)")
    print("="*60)

    # Load data
    df = load_and_prepare_data()

    # Extract features
    features = extract_features(df)

    # Prepare for clustering
    features_scaled, feature_names = prepare_for_clustering(features)

    # Perform clustering
    features = perform_clustering(features_scaled, features, n_clusters=6)

    # Identify archetypes
    features = identify_archetypes(features)

    # Create visualizations
    create_visualizations(features, df)

    # Save results
    save_results(features)

    print("\n" + "="*60)
    print("ANALYSIS COMPLETE!")
    print(f"Results saved to: {OUTPUT_DIR}")
    print("="*60)


if __name__ == '__main__':
    main()
