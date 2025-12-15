#!/usr/bin/env python3
"""
Filter and analyze UNPOPULAR names (average < 500)
"""

import pandas as pd
import sys
import os

# Import the main analysis functions
sys.path.insert(0, os.path.dirname(__file__))
from analyze_name_features import load_data, extract_features, perform_clustering, visualize_clusters, plot_trajectory_examples, identify_archetypes

def main_unpopular(max_avg_count=500, output_dir='analysis_output/unpopular_names'):
    """Analyze names with average count BELOW threshold."""
    print("Loading data...")
    df, year_cols = load_data('data/countTimeSeries.csv')
    print(f"Loaded {len(df)} names with {len(year_cols)} years of data")

    # Filter by maximum average count
    print(f"\nFiltering names with average count < {max_avg_count}...")
    df['avg_count'] = df[year_cols].apply(lambda row: row.astype(float).mean(), axis=1)
    df_filtered = df[df['avg_count'] < max_avg_count].copy()
    df_filtered = df_filtered.drop('avg_count', axis=1)
    print(f"Filtered to {len(df_filtered)} names ({len(df) - len(df_filtered)} excluded)")
    df = df_filtered

    if len(df) == 0:
        print("No names match the filter criteria!")
        return

    print("\nExtracting features...")
    features_df = extract_features(df, year_cols)
    print(f"Extracted {len(features_df.columns)} features")

    print("\nPerforming clustering...")
    features_df, X_pca, pca, scaler = perform_clustering(features_df, n_clusters=8)

    print("\nCreating visualizations...")
    os.makedirs(output_dir, exist_ok=True)
    visualize_clusters(features_df, X_pca, output_dir=output_dir)
    plot_trajectory_examples(df, features_df, year_cols, output_dir=output_dir)

    print("\nIdentifying archetypes...")
    archetypes_df = identify_archetypes(features_df)

    # Print archetype summary
    print("\n" + "="*80)
    print("ARCHETYPE SUMMARY - UNPOPULAR NAMES")
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
    max_avg = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    output = sys.argv[2] if len(sys.argv) > 2 else 'analysis_output/unpopular_names'
    main_unpopular(max_avg_count=max_avg, output_dir=output)
