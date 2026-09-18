import { Check } from 'lucide-react';

export function UnchangedItemsToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="pt-1">
      <label
        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all ${
          checked
            ? 'border-blue-200 bg-blue-50/50 text-slate-900 shadow-2xs'
            : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70'
        }`}
      >
        <span
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border shadow-2xs transition-colors ${
            checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-transparent'
          }`}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
        <input
          type="checkbox"
          id="filter-show-unchanged-items"
          className="hidden"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="flex-1">
          <span className="block text-xs font-bold leading-tight text-slate-900">Show unchanged items</span>
          <span className="mt-0.5 block text-[11px] leading-normal text-slate-500">
            Include items whose TCRS result does not meaningfully differ from the original item.
          </span>
        </span>
      </label>
    </div>
  );
}
