import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
}

interface SearchableFilterSelectProps {
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
  label: string;
  allOptionLabel: string;
  includeAllOption?: boolean;
}

export function SearchableFilterSelect({
  options,
  value,
  onChange,
  label,
  allOptionLabel,
  includeAllOption = true,
}: SearchableFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `filter-select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const allOption = options.find((option) => option.id === '__ALL__') || options[0];
  const selected = options.find((option) => option.id === value) || allOption;

  const normalizedOptions = useMemo(
    () => options.map((option) => (option.id === '__ALL__' ? { ...option, label: allOptionLabel } : option)),
    [options, allOptionLabel],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? normalizedOptions.filter((option) => option.label.toLowerCase().includes(needle))
      : normalizedOptions;
  }, [normalizedOptions, query]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const choose = (option: FilterOption) => {
    onChange?.(option.id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className="relative shrink-0 mb-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="min-w-0 sm:min-w-[240px] max-w-full inline-flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className="truncate">
            {selected?.id === '__ALL__' ? allOptionLabel : selected?.label || allOptionLabel}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {includeAllOption && selected && selected.id !== '__ALL__' && allOption && (
          <button
            type="button"
            onClick={() => choose(allOption)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Clear ${label} filter`}
            title={`Clear ${label} filter`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 left-0 w-full sm:w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={filtered[activeIndex] ? `${listboxId}-${activeIndex}` : undefined}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveIndex((index) => Math.max(index - 1, 0));
                } else if (event.key === 'Enter' && filtered[activeIndex]) {
                  event.preventDefault();
                  choose(filtered[activeIndex]);
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  setOpen(false);
                } else if (event.key === 'Tab') setOpen(false);
              }}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="w-full rounded-lg bg-slate-50 py-2 pl-8 pr-2 text-xs text-slate-800 outline-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div id={listboxId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto py-0.5">
            {filtered.length ? (
              filtered.map((option, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === selected?.id}
                  id={`${listboxId}-${index}`}
                  key={option.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                  className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${index === activeIndex ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className="truncate">{option.label}</span>
                  {option.id === selected?.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))
            ) : (
              <p className="px-2.5 py-4 text-center text-xs text-slate-400">No stores found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
