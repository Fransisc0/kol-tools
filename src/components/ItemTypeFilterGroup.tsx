import { Check } from 'lucide-react';
import type { ComponentType } from 'react';
import { ItemTypeKey } from '../types';
import { TypeConfig } from '../utils/itemUtils';

interface ItemTypeFilterGroupProps {
  title: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  options: TypeConfig[];
  allowedTypes: Record<ItemTypeKey, boolean>;
  onToggle: (type: ItemTypeKey) => void;
  columns: string;
}

export function ItemTypeFilterGroup({
  title,
  icon: HeadingIcon,
  iconClassName,
  options,
  allowedTypes,
  onToggle,
  columns,
}: ItemTypeFilterGroupProps) {
  const setGroup = (enabled: boolean) => {
    options.forEach(({ key }) => {
      if (allowedTypes[key] !== enabled) onToggle(key);
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <HeadingIcon className={`h-3.5 w-3.5 ${iconClassName}`} />
          {title}
        </span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            type="button"
            onClick={() => setGroup(true)}
            className="font-semibold text-blue-600 hover:underline"
          >
            All
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => setGroup(false)}
            className="font-semibold text-slate-500 hover:underline"
          >
            None
          </button>
        </div>
      </div>
      <div className={`grid gap-2 ${columns}`}>
        {options.map(({ key, label, icon: Icon }) => {
          const enabled = allowedTypes[key];
          return (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all ${enabled ? 'border-slate-300 bg-white text-slate-900 shadow-2xs' : 'border-slate-200 bg-white/60 text-slate-400 hover:bg-white'}`}
            >
              <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border shadow-2xs ${enabled ? 'border-slate-900 bg-slate-800 text-white' : 'border-slate-300 bg-white text-transparent'}`}
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              <input type="checkbox" className="hidden" checked={enabled} onChange={() => onToggle(key)} />
              <Icon className={`h-3.5 w-3.5 shrink-0 ${enabled ? 'text-slate-600' : 'text-slate-400'}`} />
              <span
                className={`truncate text-xs font-semibold ${enabled ? 'text-slate-800' : 'text-slate-400'}`}
              >
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
