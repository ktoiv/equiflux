# Equiflux

> A headless stock analysis CLI for private hobby use. Focused on Finnish (OMXH) companies.

Equiflux fetches real-time stock data and financial reports via Yahoo Finance and outputs enriched JSON. It also includes an optional [Electrobun](https://electrobun.dev) desktop GUI with a three-panel dashboard.

## Features

- **Search Finnish stocks** — search by name or ticker, results filtered to Helsinki exchange (.HE)
- **Financial reports** — income statement, balance sheet, and cash flow data (up to 5 years)
- **Key indicators** — P/E, dividend yield, EPS, beta, ROE, ROA
- **JSON export** — all data available as structured JSON, pipable or copyable
- **CLI** — standalone compiled binary, no runtime required

## Quick start

```bash
# Download the CLI binary from GitHub Releases
# (equiflux-linux-x64, equiflux-darwin-arm64, etc.)

chmod +x equiflux-linux-x64
./equiflux-linux-x64 -t GRK.HE -q > grk.json
```

## CLI Usage

```bash
# Fetch stock data as JSON
./equiflux-linux-x64 --ticker GRK.HE
./equiflux-linux-x64 -t NOKIA.HE           # verbose (with logs)
./equiflux-linux-x64 -t FORTUM.HE -q       # quiet (JSON only to stdout)

# Help
./equiflux-linux-x64 -h
```

## Output

The CLI outputs a JSON object with:
- Price, change, market cap, currency
- P/E ratio, dividend yield, EPS, beta, ROE, ROA
- Income statement, balance sheet, cash flow (up to 5 years)
- Company description

Pipe it to `jq` for further analysis:

```bash
./equiflux-linux-x64 -t NOKIA.HE -q | jq '.incomeStatements'
```

## Development

```bash
bun install
bun run dev:hmr        # desktop app with HMR
bun run build:cli      # compile CLI binary
bun run build:app      # build desktop app (requires electrobun)
```

## Project Structure

```
src/
├── bun/
│   ├── index.ts             # Electrobun main process (desktop app)
│   ├── cli.ts               # Headless CLI entry point
│   ├── finnish-stocks.ts    # Yahoo Finance data fetching
│   └── schemas.ts           # Zod schemas for validation & transforms
├── mainview/
│   ├── App.tsx              # Root React component
│   ├── main.tsx             # React entry point
│   ├── use-stock-api.ts     # RPC client hooks
│   ├── components/
│   │   ├── Sidebar.tsx      # Search & results
│   │   ├── ChartCard.tsx    # Recharts line chart with volume bars
│   │   ├── MarketPerformance.tsx  # Price/Open/High/Low/Volume stats
│   │   └── AnalysisPanel.tsx      # Indicators & financial reports
│   └── index.html
└── shared/
    └── rpc-schema.ts        # Typed RPC contract between Bun ↔ Webview
```

## Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Electrobun](https://electrobun.dev) (Bun-based native runtime) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS 3 |
| Bundler | Vite 6 (with HMR) |
| Charting | Recharts |
| Data fetching | yahoo-finance2 |
| Validation | Zod 4 |
| State / debounce | TanStack Query + TanStack Pacer |
| Main process | Bun runtime (`src/bun/`) |
