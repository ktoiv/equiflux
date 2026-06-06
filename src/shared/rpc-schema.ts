import type { ElectrobunRPCSchema } from 'electrobun';
import type { StockQuote, SearchHit, StockFundamentals, HistoryPoint, FinancialReports } from '../bun/schemas';

export interface AppRPCSchema extends ElectrobunRPCSchema {
	bun: {
		requests: {
			searchFinnishCompanies: { params: { query: string }; response: SearchHit[] };
			fetchQuote: { params: { symbol: string }; response: StockQuote };
			fetchQuotes: { params: { symbols: string[] }; response: StockQuote[] };
			fetchFundamentals: { params: { symbol: string }; response: StockFundamentals };
			fetchFinancialReports: { params: { symbol: string }; response: FinancialReports };
			fetchHistory: {
				params: { symbol: string; interval: string; rangeDays: number };
				response: HistoryPoint[];
			};
		};
		messages: Record<string, never>;
	};
	webview: {
		requests: Record<string, never>;
		messages: Record<string, never>;
	};
}
