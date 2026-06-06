#!/usr/bin/env bun
import { parseArgs } from 'util';
import { fetchQuote, fetchFundamentals, fetchFinancialReports } from './finnish-stocks';

function num(item: Record<string, unknown>, ...fields: string[]): number | null {
	for (const f of fields) {
		const v = item[f];
		if (typeof v === 'number') return v;
	}
	return null;
}

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		ticker: { type: 'string', short: 't' },
		quiet: { type: 'boolean', short: 'q' },
		help: { type: 'boolean', short: 'h' },
	},
});

if (values.help || !values.ticker) {
	console.log('Usage: equiflux --ticker <SYMBOL> [--quiet]');
	console.log('');
	console.log('Outputs stock data as JSON for the given ticker.');
	console.log('');
	console.log('Options:');
	console.log('  -t, --ticker <SYMBOL>  Stock symbol (e.g. NOKIA.HE)');
	console.log('  -q, --quiet            Suppress log output');
	console.log('  -h, --help             Show this help');
	console.log('');
	console.log('Examples:');
	console.log('  equiflux --ticker NOKIA.HE');
	console.log('  equiflux -t GRK.HE -q');
	process.exit(values.help ? 0 : 1);
}

let origLog: typeof console.log | undefined;

function getYear(y: Record<string, unknown>): string | null {
	const d = y.date;
	if (typeof d === 'string') return d.slice(0, 4);
	if (d instanceof Date) return String(d.getFullYear());
	return null;
}

if (values.quiet) {
	origLog = console.log.bind(console);
	globalThis.console.log = () => {};
}

const symbol = values.ticker.toUpperCase();

try {
	const [quote, fundamentals, reports] = await Promise.all([
		fetchQuote(symbol),
		fetchFundamentals(symbol),
		fetchFinancialReports(symbol),
	]);

	if (origLog) globalThis.console.log = origLog;

	const financials = reports.financials ?? [];
	const balanceSheets = reports.balanceSheet ?? [];
	const cashFlows = reports.cashFlow ?? [];

	const incomeStatements = financials.map((y: Record<string, unknown>) => ({
		year: getYear(y),
		revenue: num(y, 'totalRevenue'),
		netIncome: num(y, 'netIncome', 'netIncomeFromContinuingOperationNetMinorityInterest'),
		operatingIncome: num(y, 'operatingIncome', 'totalOperatingIncomeAsReported'),
		ebit: num(y, 'EBIT', 'ebit'),
		eps: num(y, 'dilutedEPS', 'basicEPS'),
	}));

	const balanceSheetItems = balanceSheets.map((y: Record<string, unknown>) => ({
		year: getYear(y),
		totalAssets: num(y, 'totalAssets'),
		totalLiabilities: num(y, 'totalLiabilities'),
		totalEquity: num(y, 'totalEquity'),
		cash: num(y, 'cash', 'cashAndCashEquivalents'),
		longTermDebt: num(y, 'longTermDebt', 'totalDebt'),
	}));

	const cashFlowItems = cashFlows.map((y: Record<string, unknown>) => ({
		year: getYear(y),
		operatingCashFlow: num(y, 'operatingCashFlow', 'cashFromOperatingActivities'),
		capitalExpenditure: num(y, 'capitalExpenditure', 'capitalExpenditures'),
		freeCashFlow: num(y, 'freeCashFlow'),
	}));

	const withRevenue = financials.filter((y) => num(y, 'totalRevenue') != null);
	const withAssets = balanceSheets.filter((y) => num(y, 'totalAssets') != null);
	const latestFin = withRevenue[withRevenue.length - 1] ?? {};
	const latestBal = withAssets[withAssets.length - 1] ?? {};

	const latestNetIncome = num(latestFin, 'netIncome', 'netIncomeFromContinuingOperationNetMinorityInterest');
	const latestTotalAssets = num(latestBal, 'totalAssets');
	const roi =
		latestNetIncome != null && latestTotalAssets != null && latestTotalAssets > 0
			? latestNetIncome / latestTotalAssets
			: null;

	const output = {
		symbol: quote.symbol,
		name: fundamentals.name,
		sector: fundamentals.sector,
		price: quote.price,
		change: quote.change,
		changePercent: quote.changePercent,
		currency: quote.currency,
		marketCap: quote.marketCap,
		peRatio: fundamentals.peRatio,
		dividendYield: fundamentals.dividendYield,
		eps: fundamentals.eps,
		beta: fundamentals.beta,
		returnOnEquity: fundamentals.returnOnEquity,
		returnOnAssets: roi,
		incomeStatements,
		balanceSheets: balanceSheetItems,
		cashFlows: cashFlowItems,
		description: fundamentals.description,
	};

	console.log(JSON.stringify(output, null, 2));
} catch (e) {
	console.error(`Error fetching data for ${symbol}:`, e instanceof Error ? e.message : e);
	process.exit(1);
}
