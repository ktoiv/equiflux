import type { StockQuote } from '../../bun/schemas';

function fmt(value: number, decimals = 2): string {
	return value.toFixed(decimals);
}

function fmtVolume(value: number): string {
	if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
	return value.toString();
}

interface MarketPerformanceProps {
	quote: StockQuote | null;
}

function MarketPerformance({ quote }: MarketPerformanceProps) {
	return (
		<div className="bg-surface-container-lowest rounded-[16px] p-xl soft-breath-shadow">
			<h3 className="text-h3 text-on-surface mb-lg">Market Performance</h3>
			<div className="grid grid-cols-5 gap-xl">
				<Stat label="Price" value={quote ? `€${fmt(quote.price)}` : '—'} />
				<Stat label="Open" value={quote ? `€${fmt(quote.open)}` : '—'} />
				<Stat label="High" value={quote ? `€${fmt(quote.dayHigh)}` : '—'} color="text-primary" />
				<Stat label="Low" value={quote ? `€${fmt(quote.dayLow)}` : '—'} color="text-tertiary" />
				<Stat label="Volume" value={quote ? fmtVolume(quote.volume) : '—'} />
			</div>
		</div>
	);
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
	return (
		<div>
			<span className="block text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">
				{label}
			</span>
			<span className={`block text-h3 font-semibold ${color ?? 'text-on-surface'}`}>{value}</span>
		</div>
	);
}

export default MarketPerformance;
