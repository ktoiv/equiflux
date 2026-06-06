import { BrowserWindow, BrowserView, Updater } from 'electrobun/bun';
import {
	searchFinnishCompanies,
	fetchQuote,
	fetchQuotes,
	fetchFundamentals,
	fetchFinancialReports,
	fetchHistory,
} from './finnish-stocks';
import type { AppRPCSchema } from '../shared/rpc-schema';

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === 'dev') {
		try {
			await fetch(DEV_SERVER_URL, { method: 'HEAD' });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log("Vite dev server not running. Run 'bun run dev:hmr' for HMR support.");
		}
	}
	return 'views://mainview/index.html';
}

const url = await getMainViewUrl();

const rpc = BrowserView.defineRPC<AppRPCSchema>({
	handlers: {
		requests: {
			searchFinnishCompanies: async ({ query }) => {
				console.log(`[RPC] searchFinnishCompanies query="${query}"`);
				return searchFinnishCompanies(query);
			},
			fetchQuote: async ({ symbol }) => {
				console.log(`[RPC] fetchQuote symbol="${symbol}"`);
				return fetchQuote(symbol);
			},
			fetchQuotes: async ({ symbols }) => {
				console.log(`[RPC] fetchQuotes symbols=[${symbols.join(',')}]`);
				return fetchQuotes(symbols);
			},
			fetchFundamentals: async ({ symbol }) => {
				console.log(`[RPC] fetchFundamentals symbol="${symbol}"`);
				return fetchFundamentals(symbol);
			},
			fetchFinancialReports: async ({ symbol }) => {
				console.log(`[RPC] fetchFinancialReports symbol="${symbol}"`);
				return fetchFinancialReports(symbol);
			},
			fetchHistory: async ({ symbol, interval, rangeDays }) => {
				console.log(`[RPC] fetchHistory symbol="${symbol}" interval=${interval} range=${rangeDays}d`);
				return fetchHistory(symbol, interval, rangeDays);
			},
		},
	},
});

new BrowserWindow({
	title: 'Equiflux',
	url,
	rpc,
	frame: {
		width: 1400,
		height: 900,
		x: 200,
		y: 200,
	},
});

console.log('Equiflux started!');
