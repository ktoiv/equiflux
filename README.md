# Equiflux

> A high-fidelity stock analysis desktop app for private hobby use. Focused on Finnish (OMXH) companies.

Equiflux is an [Electrobun](https://electrobun.dev) desktop application built with React, Tailwind CSS, and Vite. It fetches real-time stock data and financial reports via Yahoo Finance, presents them in a three-panel dashboard, and includes a headless CLI for scriptable data export.

## Features

- **Search Finnish stocks** — search by name or ticker, results filtered to Helsinki exchange (.HE)
- **Interactive dashboard** — real-time price, chart with time ranges (1D/1W/1M/1Y/All), market performance stats
- **Financial reports** — income statement, balance sheet, and cash flow data (up to 5 years)
- **Key indicators** — P/E, dividend yield, EPS, beta, ROE, ROA
- **Clipboard export** — copy all indicators and financial reports as JSON
- **Headless CLI** — fetch stock data from the command line, compilable to a standalone binary

## Design

- **Three-panel layout:** Sidebar (280px) | Center (fluid) | Analysis Panel (360px)
- **Color palette:** Warm parchment background (#F8F6F0), sage (#A8D5BA) for positive trends, blush (#F0C4C4) for negative indicators, soft blue (#B8D4E3) for volume/secondary data
- **Typography:** Plus Jakarta Sans — rounded humanist sans-serif
- Full design spec in [DESIGN.md](./DESIGN.md).

## Getting Started

```bash
# Install dependencies
bun install

# Desktop app — development with HMR (recommended)
bun run dev:hmr

# Desktop app — development without HMR
bun run dev

# Build for production release
bun run build:canary
```

### CLI

```bash
# Run via Bun
bun run cli --ticker GRK.HE
bun run cli -t NOKIA.HE -q       # quiet mode (JSON only to stdout)

# Compile to native binary (standalone, ~100 MB)
bun run build:cli
./equiflux -t GRK.HE -q > grk.json
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
