#!/usr/bin/env python3
"""
Feature Analysis for Baby Name Time Series
Extracts meaningful features from sparse time series data and performs clustering
to identify name archetypes.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
import hdbscan
import warnings
warnings.filterwarnings('ignore')

# Set style for visualizations
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (15, 10)


def load_data(filepath):
    """Load the time series data from CSV."""
    df = pd.read_csv(filepath)

    # Split the first column into name and gender
    first_col = df.columns[0]
    df[['name', 'gender']] = df[first_col].str.split('|', expand=True)
    df = df.drop(first_col, axis=1)

    # Convert year columns to numeric, treating 'x' as NaN
    year_cols = [col for col in df.columns if col not in ['name', 'gender']]
    for col in year_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    return df, year_cols


def extract_features(df, year_cols):
    """Extract meaningful features from time series data."""
    features = []

    for idx, row in df.iterrows():
        name = row['name']
        gender = row['gender']
        values = row[year_cols].values.astype(float)

        # Handle missing/null values
        valid_mask = ~np.isnan(values)
        valid_values = values[valid_mask]
        valid_years = np.array([int(y) for y in year_cols])[valid_mask]

        feature_dict = {
            'name': name,
            'gender': gender,
        }

        # Basic presence features
        feature_dict['years_present'] = len(valid_values)
        feature_dict['years_absent'] = len(values) - len(valid_values)
        feature_dict['presence_ratio'] = len(valid_values) / len(values)

        if len(valid_values) > 0:
            # Peak features
            feature_dict['peak_count'] = np.max(valid_values)
            peak_idx = np.argmax(valid_values)
            feature_dict['peak_year'] = valid_years[peak_idx]
            min_year = int(min(year_cols))
            max_year = int(max(year_cols))
            feature_dict['peak_year_normalized'] = (valid_years[peak_idx] - min_year) / (max_year - min_year)

            # Trend features
            feature_dict['mean_count'] = np.mean(valid_values)
            feature_dict['median_count'] = np.median(valid_values)
            feature_dict['total_count'] = np.sum(valid_values)

            # Volatility (when present)
            if len(valid_values) > 1:
                feature_dict['std_count'] = np.std(valid_values)
                feature_dict['cv_count'] = np.std(valid_values) / np.mean(valid_values) if np.mean(valid_values) > 0 else 0

                # Rate of change
                changes = np.diff(valid_values)
                feature_dict['mean_change'] = np.mean(changes)
                feature_dict['max_increase'] = np.max(changes) if len(changes) > 0 else 0
                feature_dict['max_decrease'] = np.min(changes) if len(changes) > 0 else 0
                feature_dict['volatility'] = np.std(changes)
            else:
                feature_dict['std_count'] = 0
                feature_dict['cv_count'] = 0
                feature_dict['mean_change'] = 0
                feature_dict['max_increase'] = 0
                feature_dict['max_decrease'] = 0
                feature_dict['volatility'] = 0

            # Entry/exit patterns
            feature_dict['first_year'] = valid_years[0]
            feature_dict['last_year'] = valid_years[-1]
            feature_dict['first_count'] = valid_values[0]
            feature_dict['last_count'] = valid_values[-1]
            feature_dict['debut_strength'] = valid_values[0]

            # Check if rising or falling
            if len(valid_values) >= 3:
                first_third_mean = np.mean(valid_values[:len(valid_values)//3])
                last_third_mean = np.mean(valid_values[-len(valid_values)//3:])
                feature_dict['trajectory'] = (last_third_mean - first_third_mean) / (first_third_mean + 1)
            else:
                feature_dict['trajectory'] = 0

            # Continuous runs
            gaps = np.diff(valid_years)
            continuous_runs = np.split(valid_years, np.where(gaps > 1)[0] + 1)
            feature_dict['num_runs'] = len(continuous_runs)
            feature_dict['longest_run'] = max([len(run) for run in continuous_runs])
            feature_dict['avg_run_length'] = np.mean([len(run) for run in continuous_runs])

            # Recent activity (last 5 years)
            recent_years = [str(y) for y in range(2020, 2025)]
            recent_mask = np.isin(year_cols, recent_years)
            recent_values = values[recent_mask]
            recent_valid = recent_values[~np.isnan(recent_values)]
            feature_dict['recent_presence'] = len(recent_valid)
            feature_dict['recent_mean'] = np.mean(recent_valid) if len(recent_valid) > 0 else 0

            # Early activity (first 5 years)
            early_years = [str(y) for y in range(1996, 2001)]
            early_mask = np.isin(year_cols, early_years)
            early_values = values[early_mask]
            early_valid = early_values[~np.isnan(early_values)]
            feature_dict['early_presence'] = len(early_valid)
            feature_dict['early_mean'] = np.mean(early_valid) if len(early_valid) > 0 else 0

        else:
            # No valid values
            for key in ['peak_count', 'peak_year', 'peak_year_normalized', 'mean_count',
                       'median_count', 'total_count', 'std_count', 'cv_count',
                       'mean_change', 'max_increase', 'max_decrease', 'volatility',
                       'first_year', 'last_year', 'first_count', 'last_count',
                       'debut_strength', 'trajectory', 'num_runs', 'longest_run',
                       'avg_run_length', 'recent_presence', 'recent_mean',
                       'early_presence', 'early_mean']:
                feature_dict[key] = 0

        features.append(feature_dict)

    return pd.DataFrame(features)


def perform_clustering(features_df, n_clusters=8):
    """Perform both k-means and HDBSCAN clustering."""
    # Select features for clustering (exclude name and gender)
    feature_cols = [col for col in features_df.columns if col not in ['name', 'gender']]
    X = features_df[feature_cols].fillna(0)

    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # PCA for visualization
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)

    # K-means clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    features_df['cluster_kmeans'] = kmeans.fit_predict(X_scaled)

    # HDBSCAN clustering
    clusterer = hdbscan.HDBSCAN(min_cluster_size=50, min_samples=10)
    features_df['cluster_hdbscan'] = clusterer.fit_predict(X_scaled)

    return features_df, X_pca, pca, scaler


def visualize_clusters(features_df, X_pca, output_dir='analysis_output'):
    """Create visualizations of clusters."""
    import os
    os.makedirs(output_dir, exist_ok=True)

    # Plot 1: PCA visualization with K-means clusters
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))

    # K-means
    scatter1 = axes[0].scatter(X_pca[:, 0], X_pca[:, 1],
                              c=features_df['cluster_kmeans'],
                              cmap='tab10', alpha=0.6, s=30)
    axes[0].set_xlabel('First Principal Component')
    axes[0].set_ylabel('Second Principal Component')
    axes[0].set_title('K-means Clustering (PCA projection)')
    plt.colorbar(scatter1, ax=axes[0], label='Cluster')

    # HDBSCAN
    scatter2 = axes[1].scatter(X_pca[:, 0], X_pca[:, 1],
                              c=features_df['cluster_hdbscan'],
                              cmap='tab10', alpha=0.6, s=30)
    axes[1].set_xlabel('First Principal Component')
    axes[1].set_ylabel('Second Principal Component')
    axes[1].set_title('HDBSCAN Clustering (PCA projection)')
    plt.colorbar(scatter2, ax=axes[1], label='Cluster')

    plt.tight_layout()
    plt.savefig(f'{output_dir}/clusters_pca_kmeans.png', dpi=300, bbox_inches='tight')
    plt.close()

    # Plot 2: Feature distributions per cluster (K-means)
    key_features = ['years_present', 'peak_count', 'trajectory', 'volatility',
                   'recent_mean', 'early_mean', 'longest_run']

    n_features = len(key_features)
    fig, axes = plt.subplots(2, 4, figsize=(20, 10))
    axes = axes.flatten()

    for idx, feature in enumerate(key_features):
        for cluster in sorted(features_df['cluster_kmeans'].unique()):
            cluster_data = features_df[features_df['cluster_kmeans'] == cluster][feature]
            axes[idx].hist(cluster_data, alpha=0.5, label=f'Cluster {cluster}', bins=20)
        axes[idx].set_xlabel(feature)
        axes[idx].set_ylabel('Count')
        axes[idx].set_title(f'Distribution: {feature}')
        axes[idx].legend(fontsize=8)

    # Remove extra subplot
    fig.delaxes(axes[-1])

    plt.tight_layout()
    plt.savefig(f'{output_dir}/feature_distributions.png', dpi=300, bbox_inches='tight')
    plt.close()


def plot_trajectory_examples(df, features_df, year_cols, output_dir='analysis_output'):
    """Plot example trajectories from each cluster."""
    import os
    os.makedirs(output_dir, exist_ok=True)

    n_clusters = features_df['cluster_kmeans'].nunique()
    fig, axes = plt.subplots(3, 3, figsize=(18, 12))
    axes = axes.flatten()

    for cluster in range(min(n_clusters, 9)):
        cluster_names = features_df[features_df['cluster_kmeans'] == cluster]

        # Sample 5 names from this cluster
        sample_size = min(5, len(cluster_names))
        samples = cluster_names.sample(n=sample_size, random_state=42)

        for _, sample in samples.iterrows():
            name = sample['name']
            gender = sample['gender']

            # Get time series data
            row = df[(df['name'] == name) & (df['gender'] == gender)].iloc[0]
            values = row[year_cols].values
            years = [int(y) for y in year_cols]

            # Plot with nulls visible
            axes[cluster].plot(years, values, marker='o', markersize=3, alpha=0.7, label=name)

        axes[cluster].set_xlabel('Year')
        axes[cluster].set_ylabel('Count')
        axes[cluster].set_title(f'Cluster {cluster} - Sample Trajectories')
        axes[cluster].legend(fontsize=8)
        axes[cluster].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(f'{output_dir}/trajectory_examples.png', dpi=300, bbox_inches='tight')
    plt.close()


def identify_archetypes(features_df):
    """Identify and label archetypes based on cluster characteristics."""
    archetypes = []

    for cluster in sorted(features_df['cluster_kmeans'].unique()):
        cluster_data = features_df[features_df['cluster_kmeans'] == cluster]

        # Calculate cluster statistics
        stats = {
            'cluster': cluster,
            'count': len(cluster_data),
            'avg_years_present': cluster_data['years_present'].mean(),
            'avg_peak_count': cluster_data['peak_count'].mean(),
            'avg_trajectory': cluster_data['trajectory'].mean(),
            'avg_volatility': cluster_data['volatility'].mean(),
            'avg_recent_mean': cluster_data['recent_mean'].mean(),
            'avg_early_mean': cluster_data['early_mean'].mean(),
            'avg_longest_run': cluster_data['longest_run'].mean(),
        }

        # Determine archetype based on characteristics
        # Use hierarchical classification based on peak count and trajectory
        archetype_name = "Uncategorized"

        peak = stats['avg_peak_count']
        traj = stats['avg_trajectory']
        recent = stats['avg_recent_mean']
        early = stats['avg_early_mean']

        # Extremely rare names (barely present)
        if peak < 10:
            archetype_name = "Extremely Rare"

        # Very rare names
        elif peak < 50:
            if traj > 2:
                archetype_name = "Emerging Rare Names"
            else:
                archetype_name = "Consistently Rare"

        # Uncommon names (50-500)
        elif peak < 500:
            if traj > 5:
                archetype_name = "Rising Uncommon"
            elif traj < -0.5:
                archetype_name = "Declining Uncommon"
            else:
                archetype_name = "Steady Uncommon"

        # Moderately popular names (500-2000)
        elif peak < 2000:
            if recent > early * 2 and recent > 500:
                archetype_name = "Rising Star"
            elif early > recent * 2 and early > 500:
                archetype_name = "Fading Classic"
            elif traj > 10:
                archetype_name = "Rapid Riser"
            else:
                archetype_name = "Moderate Classic"

        # Very popular names (2000-5000)
        elif peak < 5000:
            if early > recent * 2:
                archetype_name = "Declining Former Favorite"
            elif recent > early * 1.5:
                archetype_name = "Modern Hit"
            else:
                archetype_name = "Enduring Popular"

        # Mega-hits (5000+)
        else:
            if early > recent * 3:
                archetype_name = "Fading Mega-Hit"
            elif recent > early * 1.5:
                archetype_name = "Modern Mega-Hit"
            else:
                archetype_name = "Perennial Favorite"

        stats['archetype'] = archetype_name

        # Get example names
        examples = cluster_data.nlargest(5, 'peak_count')['name'].tolist()
        stats['examples'] = ', '.join(examples[:3])

        archetypes.append(stats)

    return pd.DataFrame(archetypes)


def main(min_avg_count=0, output_dir='analysis_output'):
    """Main analysis pipeline."""
    print("Loading data...")
    df, year_cols = load_data('data/countTimeSeries.csv')
    print(f"Loaded {len(df)} names with {len(year_cols)} years of data")

    # Filter by minimum average count if specified
    if min_avg_count > 0:
        print(f"\nFiltering names with average count >= {min_avg_count}...")
        df['avg_count'] = df[year_cols].apply(lambda row: row.astype(float).mean(), axis=1)
        df_filtered = df[df['avg_count'] >= min_avg_count].copy()
        df_filtered = df_filtered.drop('avg_count', axis=1)
        print(f"Filtered to {len(df_filtered)} names ({len(df) - len(df_filtered)} excluded)")
        df = df_filtered

    print("\nExtracting features...")
    features_df = extract_features(df, year_cols)
    print(f"Extracted {len(features_df.columns)} features")

    print("\nPerforming clustering...")
    features_df, X_pca, pca, scaler = perform_clustering(features_df, n_clusters=8)

    print("\nCreating visualizations...")
    visualize_clusters(features_df, X_pca, output_dir=output_dir)
    plot_trajectory_examples(df, features_df, year_cols, output_dir=output_dir)

    print("\nIdentifying archetypes...")
    archetypes_df = identify_archetypes(features_df)

    # Print archetype summary
    print("\n" + "="*80)
    print("ARCHETYPE SUMMARY")
    print("="*80)
    for _, row in archetypes_df.iterrows():
        print(f"\nCluster {row['cluster']}: {row['archetype']}")
        print(f"  Count: {row['count']}")
        print(f"  Avg years present: {row['avg_years_present']:.1f}")
        print(f"  Avg peak count: {row['avg_peak_count']:.0f}")
        print(f"  Avg trajectory: {row['avg_trajectory']:.2f}")
        print(f"  Examples: {row['examples']}")

    # Save outputs
    print("\nSaving outputs...")
    features_df.to_csv(f'{output_dir}/name_features.csv', index=False)
    archetypes_df.to_csv(f'{output_dir}/archetypes.csv', index=False)

    # Create cluster summary
    cluster_summary = features_df.groupby('cluster_kmeans').agg({
        'name': 'count',
        'years_present': 'mean',
        'peak_count': 'mean',
        'trajectory': 'mean',
        'volatility': 'mean',
        'recent_mean': 'mean'
    }).round(2)
    cluster_summary.to_csv(f'{output_dir}/cluster_summary.csv')

    print(f"\nAnalysis complete! Check the '{output_dir}' directory for results.")
    print("- clusters_pca_kmeans.png: PCA visualization of clusters")
    print("- feature_distributions.png: Feature distributions per cluster")
    print("- trajectory_examples.png: Example name trajectories per cluster")
    print("- name_features.csv: Full feature dataset with cluster assignments")
    print("- archetypes.csv: Archetype descriptions and statistics")
    print("- cluster_summary.csv: Summary statistics per cluster")


if __name__ == '__main__':
    import sys
    min_avg = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    output = sys.argv[2] if len(sys.argv) > 2 else 'analysis_output'
    main(min_avg_count=min_avg, output_dir=output)
