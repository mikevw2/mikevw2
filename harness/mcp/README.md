# MCP servers (phase 2)

Planned, built with the `mcp-builder` skill in Python (FastMCP):

- `rental-data/` — typed tools over `data/properties/*.yaml` plus a Sheets/Airtable backend:
  `get_property`, `list_units`, `unit_economics`, `rent_roll`, `log_maintenance`, `comps_search`.
- `market-data/` — quotes, OHLCV, calendars, screener execution, and a paper broker adapter:
  `quote`, `ohlcv`, `earnings_calendar`, `run_screen`, `paper_order` (subject to trade-guard).

Each server ships with a README, tool schemas, and a smoke test. Keys come from env vars only.
