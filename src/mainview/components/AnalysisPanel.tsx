import { useState, useCallback } from 'react';
import type { StockFundamentals, FinancialReports } from '../../bun/schemas';

function fmt(value: number | undefined | null, decimals = 2): string {
	if (value == null) return '—';
	return value.toFixed(decimals);
}

function fmtPct(value: number | undefined | null): string {
	if (value == null) return '—';
	const sign = value >= 0 ? '+' : '';
	return `${sign}${(value * 100).toFixed(2)}%`;
}

function fmtLarge(value: number | undefined | null): string {
	if (value == null) return '—';
	const abs = Math.abs(value);
	if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
	if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
	if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
	if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
	return value.toFixed(2);
}

function barWidth(value: number | undefined | null, max = 100): string {
	if (value == null) return '0%';
	const pct = Math.min(Math.abs(value) / max, 1) * 100;
	return `${Math.max(pct, 5)}%`;
}

type ReportItem = Record<string, unknown>;

function num(item: ReportItem, ...fields: string[]): number | null {
	for (const f of fields) {
		const v = item[f];
		if (typeof v === 'number') return v;
	}
	return null;
}

function IndicatorCard({
	label,
	value,
	change,
	barColor,
	barWidth: bw,
}: {
	label: string;
	value: string;
	change: { value: string; direction: 'up' | 'down'; color: string } | null;
	barColor: string;
	barWidth: string;
}) {
	return (
		<div className="bg-surface-container-lowest p-lg rounded-[16px] soft-breath-shadow border border-transparent hover:border-primary-container transition-colors">
			<span className="block text-label-md text-on-surface-variant mb-2 uppercase tracking-wider">{label}</span>
			<div className="flex items-baseline justify-between">
				<span className="text-h1 font-bold text-on-surface">{value}</span>
				{change && (
					<span className={`${change.color} text-label-md flex items-center`}>
						<span className="material-symbols-outlined text-[14px]">
							{change.direction === 'up' ? 'trending_up' : 'trending_down'}
						</span>
						{change.value}
					</span>
				)}
				{!change && <span className="text-on-surface-variant text-label-md">—</span>}
			</div>
			<div className="mt-4 w-full bg-surface-container rounded-full h-1">
				<div className={`${barColor} h-1 rounded-full`} style={{ width: bw }} />
			</div>
		</div>
	);
}

function ReportRow({ label, values }: { label: string; values: (number | null)[] }) {
	const hasData = values.some((v) => v != null);
	if (!hasData) return null;
	return (
		<div className="flex items-center justify-between px-sm py-1.5 bg-surface-container-lowest rounded-lg">
			<span className="text-[12px] text-on-surface-variant">{label}</span>
			<div className="flex gap-lg text-[11px] tabular-nums text-on-surface font-medium">
				{values.map((v, i) => (
					<span key={i} className="w-16 text-right">
						{fmtLarge(v)}
					</span>
				))}
			</div>
		</div>
	);
}

interface AnalysisPanelProps {
	fundamentals: StockFundamentals | null;
	isLoading: boolean;
	reports: FinancialReports | null;
	reportsLoading: boolean;
}

function AnalysisPanel({ fundamentals, isLoading, reports, reportsLoading }: AnalysisPanelProps) {
	const [showReports, setShowReports] = useState(true);
	const [copied, setCopied] = useState(false);

	const f = fundamentals;
	const r = reports;
	const financials: ReportItem[] = (r?.financials?.slice()?.reverse() as ReportItem[]) ?? [];
	const balanceSheets: ReportItem[] = (r?.balanceSheet?.slice()?.reverse() as ReportItem[]) ?? [];
	const cashFlows: ReportItem[] = (r?.cashFlow?.slice()?.reverse() as ReportItem[]) ?? [];

	const latestNetIncome =
		financials.length > 0
			? num(financials[0], 'netIncome', 'netIncomeFromContinuingOperationNetMinorityInterest')
			: null;
	const latestTotalAssets = balanceSheets.length > 0 ? num(balanceSheets[0], 'totalAssets') : null;
	const roi =
		latestNetIncome != null && latestTotalAssets != null && latestTotalAssets > 0
			? latestNetIncome / latestTotalAssets
			: null;

	const handleCopy = useCallback(() => {
		if (!f) return;
		const incomeStatements = financials.map((y) => ({
			year: typeof y.date === 'string' ? y.date.slice(0, 4) : null,
			revenue: num(y, 'totalRevenue'),
			netIncome: num(y, 'netIncome', 'netIncomeFromContinuingOperationNetMinorityInterest'),
			operatingIncome: num(y, 'operatingIncome', 'totalOperatingIncomeAsReported'),
			ebit: num(y, 'EBIT', 'ebit'),
			eps: num(y, 'dilutedEPS', 'basicEPS'),
		}));
		const balanceSheetItems = balanceSheets.map((y) => ({
			year: typeof y.date === 'string' ? y.date.slice(0, 4) : null,
			totalAssets: num(y, 'totalAssets'),
			totalLiabilities: num(y, 'totalLiabilities'),
			totalEquity: num(y, 'totalEquity'),
			cash: num(y, 'cash', 'cashAndCashEquivalents'),
			longTermDebt: num(y, 'longTermDebt', 'totalDebt'),
		}));
		const cashFlowItems = cashFlows.map((y) => ({
			year: typeof y.date === 'string' ? y.date.slice(0, 4) : null,
			operatingCashFlow: num(y, 'operatingCashFlow', 'cashFromOperatingActivities'),
			capitalExpenditure: num(y, 'capitalExpenditure', 'capitalExpenditures'),
			freeCashFlow: num(y, 'freeCashFlow'),
		}));
		const data = {
			symbol: f.symbol,
			name: f.name,
			sector: f.sector,
			peRatio: f.peRatio,
			dividendYield: f.dividendYield,
			eps: f.eps,
			beta: f.beta,
			returnOnEquity: f.returnOnEquity,
			returnOnAssets: roi,
			incomeStatements,
			balanceSheets: balanceSheetItems,
			cashFlows: cashFlowItems,
		};
		navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}, [f, roi, financials, balanceSheets, cashFlows]);

	const finYears = financials.slice(0, 3).map((y) => {
		const d = y.date;
		return typeof d === 'string' ? d.slice(0, 4) : typeof d === 'number' ? String(d) : '';
	});
	const balYears = balanceSheets.slice(0, 3).map((y) => {
		const d = y.date;
		return typeof d === 'string' ? d.slice(0, 4) : typeof d === 'number' ? String(d) : '';
	});
	const cfYears = cashFlows.slice(0, 3).map((y) => {
		const d = y.date;
		return typeof d === 'string' ? d.slice(0, 4) : typeof d === 'number' ? String(d) : '';
	});

	return (
		<aside className="w-[360px] h-screen max-h-screen fixed right-0 border-l border-outline-variant bg-surface-container-low flex flex-col">
			<div className="overflow-y-auto flex-1 px-lg py-xl space-y-lg">
				<div className="space-y-lg pr-1">
					<div className="flex items-center justify-between">
						<h3 className="text-h3 text-on-surface mb-2">Key Indicators</h3>
						{f && (
							<div className="relative">
								<button
									onClick={handleCopy}
									className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
									title="Copy as JSON"
								>
									<span className="material-symbols-outlined text-[18px]">content_copy</span>
								</button>
								{copied && (
									<div className="absolute right-0 top-full mt-1 bg-surface-container-lowest px-2 py-1 rounded shadow text-label-sm text-on-surface whitespace-nowrap">
										Copied!
									</div>
								)}
							</div>
						)}
					</div>

					{isLoading && <p className="text-label-md text-on-surface-variant text-center py-4">Loading...</p>}

					{!isLoading && !f && (
						<p className="text-label-md text-on-surface-variant text-center py-4">
							Select a stock to view indicators
						</p>
					)}

					{f && (
						<>
							<IndicatorCard
								label="P/E Ratio"
								value={fmt(f.peRatio, 1)}
								change={
									f.peRatio
										? {
												value: fmt(f.peRatio > 20 ? f.peRatio - 15 : f.peRatio - 10, 1),
												direction: f.peRatio > 20 ? 'down' : 'up',
												color: f.peRatio > 30 ? 'text-tertiary' : 'text-primary',
											}
										: null
								}
								barColor="bg-primary"
								barWidth={barWidth(f.peRatio, 50)}
							/>
							<IndicatorCard
								label="Dividend Yield"
								value={f.dividendYield != null ? fmtPct(f.dividendYield) : '—'}
								change={
									f.dividendYield
										? {
												value: fmtPct(f.dividendYield * 0.02),
												direction: 'down',
												color: 'text-tertiary',
											}
										: null
								}
								barColor="bg-tertiary"
								barWidth={barWidth(f.dividendYield ? f.dividendYield * 100 : null, 10)}
							/>
							<IndicatorCard
								label="EPS (TTM)"
								value={fmt(f.eps)}
								change={
									f.eps
										? {
												value: fmt(Math.abs(f.eps * 0.1)),
												direction: f.eps > 0 ? 'up' : 'down',
												color: f.eps > 0 ? 'text-primary' : 'text-tertiary',
											}
										: null
								}
								barColor="bg-primary"
								barWidth={barWidth(f.eps, 10)}
							/>
							<IndicatorCard
								label="Beta (5Y)"
								value={fmt(f.beta, 2)}
								change={
									f.beta
										? {
												value: fmt(Math.abs(f.beta - 1), 2),
												direction: f.beta > 1 ? 'up' : 'down',
												color: f.beta > 1.5 ? 'text-tertiary' : 'text-primary',
											}
										: null
								}
								barColor="bg-secondary"
								barWidth={barWidth(f.beta, 3)}
							/>
							<IndicatorCard
								label="ROE"
								value={f.returnOnEquity != null ? fmtPct(f.returnOnEquity) : '—'}
								change={
									f.returnOnEquity
										? {
												value: fmtPct(f.returnOnEquity * 0.05),
												direction: 'up',
												color: f.returnOnEquity > 0.15 ? 'text-primary' : 'text-tertiary',
											}
										: null
								}
								barColor="bg-primary"
								barWidth={barWidth(f.returnOnEquity, 0.5)}
							/>
							<IndicatorCard
								label="ROA"
								value={roi != null ? fmtPct(roi) : '—'}
								change={
									roi
										? {
												value: fmtPct(roi * 0.1),
												direction: roi > 0 ? 'up' : 'down',
												color: roi > 0.05 ? 'text-primary' : 'text-tertiary',
											}
										: null
								}
								barColor="bg-primary"
								barWidth={barWidth(roi, 0.2)}
							/>
						</>
					)}
				</div>

				{f && (
					<>
						<button
							onClick={() => setShowReports(!showReports)}
							className="flex items-center justify-between w-full pr-1"
						>
							<h3 className="text-h3 text-on-surface">Financial Reports</h3>
							<span
								className="material-symbols-outlined text-on-surface-variant transition-transform"
								style={{ transform: showReports ? 'rotate(180deg)' : 'none' }}
							>
								expand_more
							</span>
						</button>

						{showReports && (
							<div className="space-y-lg pr-1">
								{reportsLoading && (
									<p className="text-label-md text-on-surface-variant text-center py-4">
										Loading reports...
									</p>
								)}

								{!reportsLoading && r && (
									<>
										{financials.length > 0 && (
											<div>
												<p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
													Income Statement
												</p>
												<div className="space-y-2">
													<div className="flex items-center justify-between px-sm">
														<span className="text-[11px] text-on-surface-variant/60">
															Metric
														</span>
														<div className="flex gap-lg text-[11px] text-on-surface-variant/60 tabular-nums">
															{finYears.map((y, i) => (
																<span key={i} className="w-16 text-right">
																	{y}
																</span>
															))}
														</div>
													</div>
													<ReportRow
														label="Revenue"
														values={financials
															.slice(0, 3)
															.map((y) => num(y, 'totalRevenue'))}
													/>
													<ReportRow
														label="Net Income"
														values={financials
															.slice(0, 3)
															.map((y) =>
																num(
																	y,
																	'netIncome',
																	'netIncomeFromContinuingOperationNetMinorityInterest',
																),
															)}
													/>
													<ReportRow
														label="Operating Income"
														values={financials
															.slice(0, 3)
															.map((y) =>
																num(
																	y,
																	'operatingIncome',
																	'totalOperatingIncomeAsReported',
																),
															)}
													/>
													<ReportRow
														label="EBIT"
														values={financials
															.slice(0, 3)
															.map((y) => num(y, 'EBIT', 'ebit'))}
													/>
													<ReportRow
														label="EPS"
														values={financials
															.slice(0, 3)
															.map((y) => num(y, 'dilutedEPS', 'basicEPS'))}
													/>
												</div>
											</div>
										)}

										{balanceSheets.length > 0 && (
											<div>
												<p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
													Balance Sheet
												</p>
												<div className="space-y-2">
													<div className="flex items-center justify-between px-sm">
														<span className="text-[11px] text-on-surface-variant/60">
															Metric
														</span>
														<div className="flex gap-lg text-[11px] text-on-surface-variant/60 tabular-nums">
															{balYears.map((y, i) => (
																<span key={i} className="w-16 text-right">
																	{y}
																</span>
															))}
														</div>
													</div>
													<ReportRow
														label="Total Assets"
														values={balanceSheets
															.slice(0, 3)
															.map((y) => num(y, 'totalAssets'))}
													/>
													<ReportRow
														label="Total Liabilities"
														values={balanceSheets
															.slice(0, 3)
															.map((y) => num(y, 'totalLiabilities'))}
													/>
													<ReportRow
														label="Total Equity"
														values={balanceSheets
															.slice(0, 3)
															.map((y) => num(y, 'totalEquity'))}
													/>
													<ReportRow
														label="Cash"
														values={balanceSheets
															.slice(0, 3)
															.map((y) => num(y, 'cash', 'cashAndCashEquivalents'))}
													/>
													<ReportRow
														label="Long-term Debt"
														values={balanceSheets
															.slice(0, 3)
															.map((y) => num(y, 'longTermDebt', 'totalDebt'))}
													/>
												</div>
											</div>
										)}

										{cashFlows.length > 0 && (
											<div>
												<p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
													Cash Flow
												</p>
												<div className="space-y-2">
													<div className="flex items-center justify-between px-sm">
														<span className="text-[11px] text-on-surface-variant/60">
															Metric
														</span>
														<div className="flex gap-lg text-[11px] text-on-surface-variant/60 tabular-nums">
															{cfYears.map((y, i) => (
																<span key={i} className="w-16 text-right">
																	{y}
																</span>
															))}
														</div>
													</div>
													<ReportRow
														label="Operating CF"
														values={cashFlows
															.slice(0, 3)
															.map((y) =>
																num(
																	y,
																	'operatingCashFlow',
																	'cashFromOperatingActivities',
																),
															)}
													/>
													<ReportRow
														label="Capital Exp."
														values={cashFlows
															.slice(0, 3)
															.map((y) =>
																num(
																	y,
																	'capitalExpenditure',
																	'capitalExpenditures',
																	'purchaseOfPropertyPlantAndEquipment',
																),
															)}
													/>
													<ReportRow
														label="Free Cash Flow"
														values={cashFlows
															.slice(0, 3)
															.map((y) => num(y, 'freeCashFlow'))}
													/>
												</div>
											</div>
										)}
									</>
								)}
							</div>
						)}
					</>
				)}

				{f?.description && (
					<div className="bg-primary-fixed p-lg rounded-[16px] border border-primary-container">
						<p className="text-body-sm text-on-primary-fixed-variant leading-relaxed">
							<strong>{f.sector ?? 'Company'} Overview:</strong> {f.description.slice(0, 300)}
							{f.description.length > 300 ? '...' : ''}
						</p>
					</div>
				)}
			</div>
		</aside>
	);
}

export default AnalysisPanel;
