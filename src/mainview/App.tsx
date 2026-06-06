import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStockApi } from './use-stock-api';
import Sidebar from './components/Sidebar';
import ChartCard from './components/ChartCard';
import MarketPerformance from './components/MarketPerformance';
import AnalysisPanel from './components/AnalysisPanel';

const timePeriods = ['1D', '1W', '1M', '1Y', 'All'];

const periodConfig: Record<string, { interval: string; rangeDays: number }> = {
	'1D': { interval: '5m', rangeDays: 1 },
	'1W': { interval: '30m', rangeDays: 7 },
	'1M': { interval: '1d', rangeDays: 30 },
	'1Y': { interval: '1wk', rangeDays: 365 },
	All: { interval: '1mo', rangeDays: 1825 },
};

function fmt(value: number): string {
	return value.toFixed(2);
}

function App() {
	const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string } | null>(null);
	const [selectedPeriod, setSelectedPeriod] = useState('1M');
	const api = useStockApi();

	const symbol = selectedStock?.symbol ?? '';

	const { data: quote, isFetching: quoteLoading } = useQuery({
		queryKey: ['quote', symbol],
		queryFn: () => api.quote(symbol),
		enabled: !!symbol,
	});

	const { data: fundamentals, isFetching: fundamentalsLoading } = useQuery({
		queryKey: ['fundamentals', symbol],
		queryFn: () => api.fundamentals(symbol),
		enabled: !!symbol,
	});

	const { data: financialReports, isFetching: reportsLoading } = useQuery({
		queryKey: ['financialReports', symbol],
		queryFn: () => api.financialReports(symbol),
		enabled: !!symbol,
	});

	const cfg = periodConfig[selectedPeriod];
	const { data: history = [], isFetching: historyLoading } = useQuery({
		queryKey: ['history', symbol, selectedPeriod],
		queryFn: () => api.history(symbol, cfg.interval, cfg.rangeDays),
		enabled: !!symbol,
	});

	const change = quote ? quote.change : 0;
	const changePct = quote ? quote.changePercent : 0;
	const isPositive = change >= 0;

	return (
		<div className="text-on-surface bg-background min-h-screen flex">
			<Sidebar selectedStock={selectedStock} onSelectStock={setSelectedStock} />

			<main className="ml-[280px] mr-[360px] flex-1 min-h-screen px-margin py-xl">
				{selectedStock ? (
					<>
						<header className="flex justify-between items-center mb-xl">
							<div>
								<h1 className="text-h1 text-on-surface mb-xs">
									{selectedStock.symbol.replace('.HE', '')}
								</h1>
								<p className="text-body-md text-on-surface-variant">{selectedStock.name}</p>
								<div className="flex items-center gap-md mt-sm">
									{quoteLoading ? (
										<>
											<span className="text-display text-on-surface">€—</span>
											<span className="px-2 py-1 rounded bg-surface-container text-on-surface-variant text-label-md">
												Loading...
											</span>
										</>
									) : quote ? (
										<>
											<span className="text-display text-on-surface">
												€{fmt(quote.price)}
											</span>
											<span
												className={`px-2 py-1 rounded text-label-md ${
													isPositive
														? 'bg-primary-container text-on-primary-container'
														: 'bg-tertiary-container text-on-tertiary-container'
												}`}
											>
												{isPositive ? '+' : ''}
												{fmt(change)} ({isPositive ? '+' : ''}
												{fmt(changePct)}%) Today
											</span>
										</>
									) : null}
								</div>
							</div>
							<div className="flex gap-sm">
								<button className="material-symbols-outlined p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant">
									notifications
								</button>
								<button className="material-symbols-outlined p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant">
									account_circle
								</button>
							</div>
						</header>

						<ChartCard
							timePeriods={timePeriods}
							selectedPeriod={selectedPeriod}
							onSelectPeriod={setSelectedPeriod}
							data={history}
							isLoading={historyLoading}
						/>

						<MarketPerformance quote={quote ?? null} />
					</>
				) : (
					<div className="flex items-center justify-center h-full text-on-surface-variant">
						<div className="text-center">
							<span className="material-symbols-outlined text-5xl mb-4">search</span>
							<p className="text-body-md">Search for a Finnish stock to get started</p>
						</div>
					</div>
				)}
			</main>

			<AnalysisPanel
				fundamentals={fundamentals ?? null}
				isLoading={fundamentalsLoading}
				reports={financialReports ?? null}
				reportsLoading={reportsLoading}
			/>
		</div>
	);
}

export default App;
