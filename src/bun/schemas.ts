import { z } from 'zod';

const QuoteSchema = z
	.object({
		symbol: z.string(),
		shortName: z.string().optional(),
		longName: z.string().optional(),
		regularMarketPrice: z.number().optional(),
		regularMarketChange: z.number().optional(),
		regularMarketChangePercent: z.number().optional(),
		regularMarketVolume: z.number().optional(),
		marketCap: z.number().optional(),
		currency: z.string().optional(),
		regularMarketDayHigh: z.number().optional(),
		regularMarketDayLow: z.number().optional(),
		regularMarketOpen: z.number().optional(),
		regularMarketPreviousClose: z.number().optional(),
		fiftyTwoWeekHigh: z.number().optional(),
		fiftyTwoWeekLow: z.number().optional(),
		trailingPE: z.number().optional().nullable(),
		marketState: z.string().optional(),
	})
	.transform((raw) => ({
		symbol: raw.symbol,
		name: raw.shortName ?? raw.longName ?? raw.symbol,
		price: raw.regularMarketPrice ?? 0,
		change: raw.regularMarketChange ?? 0,
		changePercent: raw.regularMarketChangePercent ?? 0,
		volume: raw.regularMarketVolume ?? 0,
		marketCap: raw.marketCap ?? 0,
		currency: raw.currency ?? 'EUR',
		dayHigh: raw.regularMarketDayHigh ?? 0,
		dayLow: raw.regularMarketDayLow ?? 0,
		open: raw.regularMarketOpen ?? 0,
		previousClose: raw.regularMarketPreviousClose ?? 0,
		fiftyTwoWeekHigh: raw.fiftyTwoWeekHigh ?? 0,
		fiftyTwoWeekLow: raw.fiftyTwoWeekLow ?? 0,
		peRatio: raw.trailingPE ?? null,
		marketState: raw.marketState ?? 'UNKNOWN',
	}));

export const QuotesSchema = z.array(QuoteSchema);

const HistoryQuoteSchema = z
	.object({
		date: z.union([z.date(), z.number().transform((n) => new Date(n * 1000))]),
		open: z.number().optional().nullable(),
		high: z.number().optional().nullable(),
		low: z.number().optional().nullable(),
		close: z.number().optional().nullable(),
		volume: z.number().optional().nullable(),
	})
	.transform((raw) =>
		raw.open != null && raw.close != null
			? {
					date: raw.date instanceof Date ? raw.date : new Date(raw.date),
					open: raw.open,
					high: raw.high ?? 0,
					low: raw.low ?? 0,
					close: raw.close,
					volume: raw.volume ?? 0,
				}
			: null,
	);

export const ChartSchema = z
	.object({
		quotes: z.array(HistoryQuoteSchema).optional(),
	})
	.transform((raw) => (raw.quotes ?? []).filter((q): q is NonNullable<typeof q> => q !== null));

const SearchHitSchema = z
	.object({
		symbol: z.string().optional(),
		shortname: z.string().optional(),
		longname: z.string().optional(),
		exchange: z.string().optional(),
		quoteType: z.string().optional(),
		fullExchangeName: z.string().optional(),
	})
	.transform((raw) => ({
		symbol: raw.symbol ?? '',
		name: raw.shortname ?? raw.longname ?? raw.symbol ?? '',
		exchange: raw.exchange ?? '',
		type: raw.quoteType ?? '',
	}));

export const SearchSchema = z
	.object({
		quotes: z.array(SearchHitSchema),
	})
	.transform((raw) => raw.quotes);

export const FinnishSearchSchema = SearchSchema.transform((hits) =>
	hits.filter((h) => h.exchange === 'HEL' || h.symbol.endsWith('.HE')),
);

const AssetProfileSchema = z.object({
	sector: z.string().optional(),
	industry: z.string().optional(),
	fullTimeEmployees: z.number().optional(),
	longBusinessSummary: z.string().optional(),
	website: z.string().optional(),
});

const FinancialDataSchema = z.object({
	marketCap: z.number().optional(),
	enterpriseValue: z.number().optional(),
	forwardPE: z.number().optional(),
	priceToSales: z.number().optional(),
	profitMargins: z.number().optional(),
	returnOnEquity: z.number().optional(),
	returnOnAssets: z.number().optional(),
	debtToEquity: z.number().optional(),
	totalRevenue: z.number().optional(),
	revenuePerShare: z.number().optional(),
	recommendationKey: z.string().optional(),
	targetMeanPrice: z.number().optional(),
	targetHighPrice: z.number().optional(),
});

const DefaultKeyStatisticsSchema = z.object({
	trailingPE: z.number().optional(),
	pegRatio: z.number().optional(),
	priceToBook: z.number().optional(),
	dividendYield: z.number().optional(),
	dividendRate: z.number().optional(),
	beta: z.number().optional(),
	trailingEps: z.number().optional(),
	forwardEps: z.number().optional(),
	bookValue: z.number().optional(),
	sharesOutstanding: z.number().optional(),
	shortRatio: z.number().optional(),
});

const SummaryDetailSchema = z.object({
	trailingPE: z.number().optional(),
	forwardPE: z.number().optional(),
	priceToBook: z.number().optional(),
	dividendYield: z.number().optional(),
	dividendRate: z.number().optional(),
	exDividendDate: z.union([z.date(), z.number()]).optional(),
	beta: z.number().optional(),
	trailingEPS: z.number().optional(),
	forwardEPS: z.number().optional(),
	bookValue: z.number().optional(),
	sharesOutstanding: z.number().optional(),
	marketCap: z.number().optional(),
	earningsTimestamp: z.union([z.date(), z.number()]).optional(),
});

const PriceSchema = z.object({
	shortName: z.string().optional(),
	longName: z.string().optional(),
});

function toDate(v: Date | number | undefined): Date | undefined {
	if (v instanceof Date) return v;
	if (typeof v === 'number') return new Date(v * 1000);
	return undefined;
}

const RawQuoteSummary = z.object({
	symbol: z.string(),
	assetProfile: AssetProfileSchema.optional(),
	financialData: FinancialDataSchema.optional(),
	defaultKeyStatistics: DefaultKeyStatisticsSchema.optional(),
	summaryDetail: SummaryDetailSchema.optional(),
	price: PriceSchema.optional(),
});

export const FundamentalsSchema = RawQuoteSummary.transform((raw) => {
	const ap = raw.assetProfile;
	const fd = raw.financialData;
	const dks = raw.defaultKeyStatistics;
	const sd = raw.summaryDetail;
	const p = raw.price;

	return {
		symbol: raw.symbol,
		name: p?.shortName ?? p?.longName ?? raw.symbol,
		sector: ap?.sector,
		industry: ap?.industry,
		employees: ap?.fullTimeEmployees,
		description: ap?.longBusinessSummary,
		website: ap?.website,
		marketCap: fd?.marketCap ?? sd?.marketCap,
		enterpriseValue: fd?.enterpriseValue,
		peRatio: sd?.trailingPE ?? dks?.trailingPE,
		forwardPE: sd?.forwardPE ?? fd?.forwardPE,
		pegRatio: dks?.pegRatio,
		priceToBook: sd?.priceToBook ?? dks?.priceToBook,
		priceToSales: fd?.priceToSales,
		dividendYield: sd?.dividendYield ?? dks?.dividendYield,
		dividendRate: sd?.dividendRate ?? dks?.dividendRate,
		exDividendDate: toDate(sd?.exDividendDate),
		beta: sd?.beta ?? dks?.beta,
		eps: sd?.trailingEPS ?? dks?.trailingEps,
		epsForward: sd?.forwardEPS ?? dks?.forwardEps,
		revenue: fd?.totalRevenue,
		revenuePerShare: fd?.revenuePerShare,
		profitMargin: fd?.profitMargins,
		returnOnEquity: fd?.returnOnEquity,
		returnOnAssets: fd?.returnOnAssets,
		debtToEquity: fd?.debtToEquity,
		bookValue: sd?.bookValue ?? dks?.bookValue,
		sharesOutstanding: sd?.sharesOutstanding ?? dks?.sharesOutstanding,
		shortRatio: dks?.shortRatio,
		recommendation: fd?.recommendationKey,
		targetPrice: fd?.targetMeanPrice ?? fd?.targetHighPrice,
		earningsDate: toDate(sd?.earningsTimestamp),
	};
});

export type StockQuote = z.infer<typeof QuoteSchema>;
export type HistoryPoint = NonNullable<z.infer<typeof HistoryQuoteSchema>>;
export type StockFundamentals = z.infer<typeof FundamentalsSchema>;
export type SearchHit = z.infer<typeof SearchHitSchema>;

const FinancialReportItemSchema = z.record(z.string(), z.unknown()).nullable();
const FinancialReportsArraySchema = z.array(FinancialReportItemSchema).nullable().default([]);

export const FinancialReportsSchema = z
	.object({
		financials: FinancialReportsArraySchema,
		balanceSheet: FinancialReportsArraySchema,
		cashFlow: FinancialReportsArraySchema,
	})
	.transform((raw) => ({
		financials: raw.financials ? raw.financials.filter((x): x is Record<string, unknown> => x != null) : [],
		balanceSheet: raw.balanceSheet ? raw.balanceSheet.filter((x): x is Record<string, unknown> => x != null) : [],
		cashFlow: raw.cashFlow ? raw.cashFlow.filter((x): x is Record<string, unknown> => x != null) : [],
	}));

export type FinancialReports = z.infer<typeof FinancialReportsSchema>;
