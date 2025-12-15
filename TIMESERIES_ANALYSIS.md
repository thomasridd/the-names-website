Please perform shape-based clustering on my baby name time series data using tslearn.

Dataset details:
- file data/countTimeSeries.csv
- approx 8000 time series, each with 29 data points (yearly popularity)
- Data represents baby name popularity trends over time
- Looking to identify trajectory archetypes (e.g., "steady decline", "viral spike", "comeback", "stable classic")

Tasks:
1. Install tslearn if needed
2. Load and prepare the data for clustering
3. Use TimeSeriesKMeans with DTW (Dynamic Time Warping) distance metric
4. Try k=5-8 clusters initially
5. Visualize the cluster centroids and show example names from each cluster
6. Create a silhouette score plot to help determine optimal k
7. Save the cluster assignments back to the dataset

Please normalize the time series before clustering and show me the characteristic shape of each cluster.