import { Electroview } from 'electrobun/view';
import { useMemo } from 'react';
import type { AppRPCSchema } from '../shared/rpc-schema';

const rpc = Electroview.defineRPC<AppRPCSchema>({
	handlers: {
		requests: {},
		messages: {},
	},
});

new Electroview({ rpc });

export function useStockApi() {
	return useMemo(
		() => ({
			search: (query: string) => rpc.request.searchFinnishCompanies({ query }),
			quote: (symbol: string) => rpc.request.fetchQuote({ symbol }),
			quotes: (symbols: string[]) => rpc.request.fetchQuotes({ symbols }),
			fundamentals: (symbol: string) => rpc.request.fetchFundamentals({ symbol }),
			financialReports: (symbol: string) => rpc.request.fetchFinancialReports({ symbol }),
			history: (symbol: string, interval: string, rangeDays: number) =>
				rpc.request.fetchHistory({ symbol, interval, rangeDays }),
		}),
		[],
	);
}
