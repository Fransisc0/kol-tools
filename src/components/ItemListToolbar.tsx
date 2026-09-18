import { ArrowUpDown, Search, X } from 'lucide-react';
import { ItemSort } from '../utils/itemFiltering';

export type PageSize = number | 'all';

interface ItemListToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: ItemSort;
  onSortChange: (value: ItemSort) => void;
  pageSize: PageSize;
  onPageSizeChange: (value: PageSize) => void;
}

export function ItemListToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  pageSize,
  onPageSizeChange,
}: ItemListToolbarProps) {
  return (
    <div className="flex flex-col items-stretch justify-between gap-1.5 border-t border-slate-100 pt-1.5 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="filter-search-input"
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search items…"
          className="min-h-[34px] w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-8 text-xs transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 flex min-h-[28px] min-w-[28px] -translate-y-1/2 items-center justify-center rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-1.5 sm:gap-2 md:justify-end">
        <div className="flex flex-1 items-center gap-1 sm:flex-none">
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <select
            id="filter-sort-select"
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as ItemSort)}
            className="min-h-[34px] w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none sm:w-auto"
          >
            <option value="bonus_desc">Bonus (High → Low)</option>
            <option value="bonus_asc">Bonus (Low → High)</option>
            <option value="duration">Duration</option>
            <option value="name">Original Name (A → Z)</option>
            <option value="id">Item ID</option>
          </select>
        </div>

        <select
          id="filter-page-size-select"
          value={pageSize}
          onChange={(event) =>
            onPageSizeChange(event.target.value === 'all' ? 'all' : Number(event.target.value))
          }
          aria-label="Items per page"
          className="min-h-[34px] cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="24">24 / pg</option>
          <option value="48">48 / pg</option>
          <option value="96">96 / pg</option>
          <option value="all">All</option>
        </select>
      </div>
    </div>
  );
}
