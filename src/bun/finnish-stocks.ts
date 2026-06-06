import YahooFinance from 'yahoo-finance2';
import { QuotesSchema, ChartSchema, SearchSchema, FinnishSearchSchema, FundamentalsSchema, FinancialReportsSchema } from './schemas';
import type { StockQuote, HistoryPoint, StockFundamentals, SearchHit, FinancialReports } from './schemas';

const yf = new YahooFinance({
	validation: { logErrors: false },
	versionCheck: false,
});

export type { StockQuote, HistoryPoint, StockFundamentals, SearchHit };

export async function searchCompanies(query: string): Promise<SearchHit[]> {
	console.log(`[FinnishStocks] searchCompanies query="${query}"`);
	const raw = await yf.search(query);
	const parsed = SearchSchema.parse(raw);
	console.log(`[FinnishStocks] searchCompanies got ${parsed.length} results`);
	return parsed;
}

export async function searchFinnishCompanies(query: string): Promise<SearchHit[]> {
	console.log(`[FinnishStocks] searchFinnishCompanies query="${query}"`);
	const raw = await yf.search(query);
	const parsed = FinnishSearchSchema.parse(raw);
	console.log(`[FinnishStocks] searchFinnishCompanies got ${parsed.length} Helsinki matches`);
	return parsed;
}

export async function fetchQuote(symbol: string): Promise<StockQuote> {
	console.log(`[FinnishStocks] fetchQuote symbol="${symbol}"`);
	const [raw] = await yf.quote([symbol]);
	const parsed = QuotesSchema.parse([raw])[0];
	console.log(`[FinnishStocks] fetchQuote ${symbol}: $${parsed.price}`);
	return parsed;
}

export async function fetchQuotes(symbols: string[]): Promise<StockQuote[]> {
	console.log(`[FinnishStocks] fetchQuotes symbols=[${symbols.join(', ')}]`);
	const raw = await yf.quote(symbols);
	const parsed = QuotesSchema.parse(raw);
	console.log(`[FinnishStocks] fetchQuotes got ${parsed.length} quotes`);
	return parsed;
}

export async function fetchHistory(
	symbol: string,
	interval: string,
	rangeDays: number,
): Promise<HistoryPoint[]> {
	console.log(`[FinnishStocks] fetchHistory symbol="${symbol}" interval=${interval} range=${rangeDays}d`);
	const period2 = new Date();
	const period1 = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
	const raw = await yf.chart(symbol, {
		period1,
		period2,
		interval: interval as '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo',
	});
	const parsed = ChartSchema.parse(raw);
	console.log(`[FinnishStocks] fetchHistory got ${parsed.length} data points`);
	return parsed;
}

export async function fetchFundamentals(symbol: string): Promise<StockFundamentals> {
	console.log(`[FinnishStocks] fetchFundamentals symbol="${symbol}"`);
	const raw = await yf.quoteSummary(symbol, {
		modules: [
			'assetProfile',
			'financialData',
			'defaultKeyStatistics',
			'summaryDetail',
			'price',
			'recommendationTrend',
			'calendarEvents',
		],
	});
	const parsed = FundamentalsSchema.parse({ symbol, ...raw });
	console.log(`[FinnishStocks] fetchFundamentals ${symbol}: name="${parsed.name}"`);
	return parsed;
}

export async function fetchFinancialReports(symbol: string): Promise<FinancialReports> {
	console.log(`[FinnishStocks] fetchFinancialReports symbol="${symbol}"`);

	const fetchModule = async (mod: string) => {
		try {
			const result = await yf.fundamentalsTimeSeries(symbol, {
				period1: new Date('2019-01-01'),
				module: mod,
				type: 'annual',
			});
			return Array.isArray(result) ? result : [];
		} catch (e) {
			console.log(`[FinnishStocks] fetchFinancialReports module=${mod} failed:`, e);
			return [];
		}
	};

	const [financials, balanceSheet, cashFlow] = await Promise.all([
		fetchModule('financials'),
		fetchModule('balance-sheet'),
		fetchModule('cash-flow'),
	]);

	const parsed = FinancialReportsSchema.parse({
		financials,
		balanceSheet,
		cashFlow,
	});

	console.log(
		`[FinnishStocks] fetchFinancialReports: ${parsed.financials.length} financials, ${parsed.balanceSheet.length} balance sheets, ${parsed.cashFlow.length} cash flow statements`,
	);
	return parsed;
}
