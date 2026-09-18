import { Utensils, Wine } from 'lucide-react';
import type { BoozeQualityFilter, FoodQualityFilter } from '../types';

interface SidebarQualityFiltersProps {
  foodQualityFilter?: FoodQualityFilter;
  setFoodQualityFilter?: (filter: FoodQualityFilter) => void;
  boozeQualityFilter?: BoozeQualityFilter;
  setBoozeQualityFilter?: (filter: BoozeQualityFilter) => void;
}

function OptionButton<T extends string>({
  id,
  label,
  selected,
  onSelect,
}: {
  id: T;
  label: string;
  selected: boolean;
  onSelect: (id: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`cursor-pointer rounded-lg border p-2 text-center text-xs font-semibold transition-all ${
        selected
          ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

export function SidebarQualityFilters({
  foodQualityFilter,
  setFoodQualityFilter,
  boozeQualityFilter,
  setBoozeQualityFilter,
}: SidebarQualityFiltersProps) {
  return (
    <>
      {foodQualityFilter && setFoodQualityFilter && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Utensils className="h-3.5 w-3.5 text-amber-600" /> Food Quality Threshold
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ['awesome-plus', 'Awesome+'],
                ['epic', 'EPIC Only'],
                ['awesome', 'Awesome'],
                ['all', 'All Qualities'],
              ] as const
            ).map(([id, label]) => (
              <OptionButton
                key={id}
                id={id}
                label={label}
                selected={foodQualityFilter === id}
                onSelect={setFoodQualityFilter}
              />
            ))}
          </div>
        </div>
      )}

      {boozeQualityFilter && setBoozeQualityFilter && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Wine className="h-3.5 w-3.5 text-purple-600" /> Booze Quality
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['epic', 'EPIC Only'],
                ['all', 'All Booze'],
              ] as const
            ).map(([id, label]) => (
              <OptionButton
                key={id}
                id={id}
                label={label}
                selected={boozeQualityFilter === id}
                onSelect={setBoozeQualityFilter}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
