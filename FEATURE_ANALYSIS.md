I have ~40000 baby name time series representing rankings. I have decades from 1904 to 1994. These have the top 100 rankings. An x indicates they were not in the top 100. From 1996 I have more detailed data.

The file is data/all_ranks.csv

x means lower than 3 babies given name that year

Please:
1. Create meaningful features that handle sparse data:
   - Years in top 100
   - Years in top 10
   - Years in top 100 within the last 5 years
   - Peak ranking and year achieved
   - Entry/exit patterns (did it debut high or climb?)
   - Volatility/stability when present
   - Length of continuous runs
   
2. Use these features for clustering (try HDBSCAN or k-means)

3. Visualize clusters showing:
   - Feature distributions per cluster
   - Example name trajectories (with nulls visible)
   - Cluster interpretations

4. Identify archetypes like "one-hit wonder", "steady classic", "recent entrant", "declining former favorite"
