import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  const buttonClass =
    'min-h-[28px] rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30';

  return (
    <nav
      className="mt-2 flex shrink-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-xs sm:mt-2.5 sm:rounded-2xl sm:px-3 sm:py-2"
      aria-label="Item pages"
    >
      <span className="text-[11px] text-slate-500 sm:text-xs">
        Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
        <strong className="text-slate-800">{totalPages}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`${buttonClass} min-w-[28px] p-1`}
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`${buttonClass} inline-flex items-center gap-1 px-1.5 font-medium sm:px-2`}
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>
        <span className="px-1.5 font-mono text-slate-500">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`${buttonClass} inline-flex items-center gap-1 px-1.5 font-medium sm:px-2`}
          aria-label="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`${buttonClass} min-w-[28px] p-1`}
          title="Last Page"
          aria-label="Last Page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
}
