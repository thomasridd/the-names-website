# Docs

Starting-point documentation for the 2025 data refactor. These files describe the **current** site so nothing regresses while we rebuild the data pipeline.

- [FEATURES.md](./FEATURES.md) — pages, URL structure, search, build modes.
- [CLASSIFICATIONS.md](./CLASSIFICATIONS.md) — the three classification dimensions (five_year, recent, historic) and the rule that they remain pre-computed.
- [DATA-PIPELINE.md](./DATA-PIPELINE.md) — source CSVs, per-name schema, the current script sequence, and goals for the refactor.

The higher-level project guide at `../CLAUDE.md` is out of date in places (mentions an earlier 15+16 classification set, hardcoded 2024 cut-off) and will be refreshed once the refactor lands.
