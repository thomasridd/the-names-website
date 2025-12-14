I have ~8000 baby name time series (13 decades) representing top-100 rankings, with many null values when names fall out of the top 100.

The file is data/rankHistoricTimeSeries.csv

x mean "ranked 101+"

Please:
1. Create meaningful features that handle sparse data:
   - Years in top 100
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
