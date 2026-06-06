import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useStockApi } from '../use-stock-api';
import type { SearchHit } from '../../bun/schemas';

interface SidebarProps {
	selectedStock: { symbol: string; name: string } | null;
	onSelectStock: (hit: { symbol: string; name: string }) => void;
}

function Sidebar({ selectedStock, onSelectStock }: SidebarProps) {
	const [query, setQuery] = useState('');
	const [debouncedQuery] = useDebouncedValue(query, { wait: 500 });
	const api = useStockApi();

	const { data: results = [], isFetching } = useQuery<SearchHit[]>({
		queryKey: ['search', debouncedQuery],
		queryFn: () => api.search(debouncedQuery),
		enabled: debouncedQuery.trim().length > 0,
	});

	return (
		<aside className="flex flex-col h-screen left-0 w-[280px] bg-surface-container-low border-r border-outline-variant py-xl px-lg fixed">
			<div className="mb-xl">
				<h2 className="text-2xl font-semibold text-primary">Equiflux</h2>
			</div>

			<div className="relative mb-lg">
				<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
					search
				</span>
				<input
					className="w-full bg-surface-container-highest border-none rounded-[8px] pl-10 pr-4 py-2 text-body-sm focus:ring-1 focus:ring-primary-container"
					placeholder="Search Finnish markets..."
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</div>

			<nav className="flex-1 overflow-y-auto space-y-1">
				{selectedStock && (
					<div className="mb-md flex items-center px-sm py-2 rounded-lg bg-primary-container text-on-primary-container scale-[0.98]">
						<span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 1" }}>
							analytics
						</span>
						<div className="flex flex-col min-w-0">
							<span className="text-label-md font-bold truncate">{selectedStock.name}</span>
							<span className="text-[12px] truncate">
								{selectedStock.symbol.replace('.HE', '')} · Active
							</span>
						</div>
					</div>
				)}

				{isFetching && <p className="text-label-md text-on-surface-variant text-center py-4">Searching...</p>}

				{!isFetching && results.length === 0 && debouncedQuery.trim() && (
					<p className="text-label-md text-on-surface-variant text-center py-4">No results</p>
				)}

				{results
					.filter((s) => s.symbol !== selectedStock?.symbol)
					.map((s) => (
						<button
							key={s.symbol}
							onClick={() => onSelectStock({ symbol: s.symbol, name: s.name })}
							className="w-full mb-sm flex items-center px-sm py-2 rounded-lg text-left text-on-surface-variant hover:bg-surface-container-high transition-colors duration-150"
						>
							<span className="material-symbols-outlined mr-3 text-[18px]">analytics</span>
							<div className="flex flex-col min-w-0">
								<span className="text-label-md font-medium truncate">{s.name}</span>
								<span className="text-[12px] truncate">{s.symbol.replace('.HE', '')}</span>
							</div>
						</button>
					))}
			</nav>
		</aside>
	);
}

export default Sidebar;
