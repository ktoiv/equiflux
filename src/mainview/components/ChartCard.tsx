import { ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import type { HistoryPoint } from '../../bun/schemas';

interface ChartCardProps {
	timePeriods: string[];
	selectedPeriod: string;
	onSelectPeriod: (period: string) => void;
	data: HistoryPoint[];
	isLoading: boolean;
}

function formatPrice(value: number): string {
	if (value >= 1000) return value.toFixed(0);
	if (value >= 10) return value.toFixed(2);
	return value.toFixed(3);
}

function formatVolume(value: number): string {
	if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
	return value.toString();
}

function formatDate(ts: number, period: string): string {
	const d = new Date(ts);
	if (period === '1D') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	if (period === '1W') return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
	if (period === '1M') return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
	return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: HistoryPoint }> }) {
	if (!active || !payload?.length) return null;
	const p = payload[0].payload;
	return (
		<div className="bg-surface-container-lowest px-md py-sm rounded-lg shadow text-label-md border border-outline-variant">
			<p className="text-on-surface-variant mb-1">
				{new Date(p.date).toLocaleDateString([], {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				})}
			</p>
			<p className="text-on-surface font-semibold">€{formatPrice(p.close)}</p>
			<p className="text-on-surface-variant">Vol: {formatVolume(p.volume)}</p>
		</div>
	);
}

function ChartCard({ timePeriods, selectedPeriod, onSelectPeriod, data, isLoading }: ChartCardProps) {
	const chartData = data.map((p) => ({
		...p,
		ts: p.date instanceof Date ? p.date.getTime() : new Date(p.date).getTime(),
	}));

	return (
		<div className="bg-surface-container-lowest rounded-[16px] p-lg soft-breath-shadow mb-xl">
			<div className="flex justify-between items-center mb-lg">
				<div className="flex gap-2 bg-surface-container rounded-full p-1">
					{timePeriods.map((p) => {
						const isActive = selectedPeriod === p;
						return (
							<button
								key={p}
								onClick={() => onSelectPeriod(p)}
								className={`px-4 py-1.5 rounded-full text-label-md transition-colors ${
									isActive
										? 'bg-primary-container text-on-primary-container'
										: 'text-on-surface-variant hover:bg-surface-container-highest'
								}`}
							>
								{p}
							</button>
						);
					})}
				</div>
				<div className="flex gap-lg">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-primary" />
						<span className="text-label-md text-on-surface-variant">Price</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-secondary-container" />
						<span className="text-label-md text-on-surface-variant">Volume</span>
					</div>
				</div>
			</div>

			{isLoading && (
				<div className="h-[320px] flex items-center justify-center text-on-surface-variant text-label-md">
					Loading chart...
				</div>
			)}

			{!isLoading && chartData.length === 0 && (
				<div className="h-[320px] flex items-center justify-center text-on-surface-variant text-label-md">
					No data available
				</div>
			)}

			{!isLoading && chartData.length > 1 && (
				<ResponsiveContainer width="100%" height={320}>
					<ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
						<defs>
							<linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#a8d5ba" stopOpacity="0.3" />
								<stop offset="100%" stopColor="#a8d5ba" stopOpacity="0" />
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" stroke="#e2e3df" vertical={false} />
						<XAxis
							dataKey="ts"
							scale="time"
							type="number"
							tickFormatter={(ts) => formatDate(ts, selectedPeriod)}
							stroke="#636e72"
							fontSize={11}
							tickLine={false}
							axisLine={false}
							domain={['dataMin', 'dataMax']}
							minTickGap={40}
						/>
						<YAxis
							yAxisId="price"
							orientation="right"
							stroke="#636e72"
							fontSize={11}
							tickLine={false}
							axisLine={false}
							tickFormatter={formatPrice}
							domain={['dataMin', 'dataMax']}
							width={50}
						/>
						<YAxis yAxisId="volume" orientation="left" hide domain={[0, 'dataMax']} />
						<Tooltip content={<CustomTooltip />} />
						<Area
							yAxisId="price"
							type="monotone"
							dataKey="close"
							stroke="#3d6751"
							strokeWidth={2}
							fill="url(#priceGrad)"
							dot={false}
							activeDot={{ r: 4, fill: '#3d6751' }}
						/>
						<Bar yAxisId="volume" dataKey="volume" fill="#c8e4f3" opacity={0.4} maxBarSize={8} />
					</ComposedChart>
				</ResponsiveContainer>
			)}

			{chartData.length > 0 && (
				<div className="flex justify-between text-label-sm text-on-surface-variant mt-2">
					<span>Low: €{formatPrice(Math.min(...chartData.map((p) => p.close)))}</span>
					<span>Vol Avg: {formatVolume(chartData.reduce((s, p) => s + p.volume, 0) / chartData.length)}</span>
					<span>High: €{formatPrice(Math.max(...chartData.map((p) => p.close)))}</span>
				</div>
			)}
		</div>
	);
}

export default ChartCard;
