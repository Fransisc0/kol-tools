import { Ban, CheckCircle2, Hammer, Sparkles, Store } from 'lucide-react';
import type { TypeConfig } from '../config/itemTypes';
import type { AllowedTagKey, AllowedTags, ItemTypeKey } from '../types';

interface ItemListDesktopFiltersProps {
  allowedTags: AllowedTags;
  allowedTypes: Record<ItemTypeKey, boolean>;
  availableTypes: TypeConfig[];
  typeCounts: Record<ItemTypeKey, number>;
  onToggleTag: (tag: AllowedTagKey) => void;
  onToggleType: (type: ItemTypeKey) => void;
  onThriftyOnly: () => void;
  onAllSources: () => void;
  onConsumablesOnly: () => void;
  onGearOnly: () => void;
  onAllTypes: () => void;
}

const tagOptions = [
  ['Thrifty Accessible', 'Thrifty', CheckCircle2, 'emerald'],
  ['Non-Thrifty', 'Non-Thrifty', Ban, 'rose'],
  ['NPC Store', 'NPC Store', Store, 'blue'],
  ['Craftable', 'Craftable', Hammer, 'amber'],
  ['Drops / Other', 'Drops', Sparkles, 'slate'],
] as const;

const activeClasses = {
  emerald: 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-800',
  rose: 'border-rose-300 bg-rose-50 font-semibold text-rose-800',
  blue: 'border-blue-300 bg-blue-50 font-semibold text-blue-800',
  amber: 'border-amber-300 bg-amber-50 font-semibold text-amber-900',
  slate: 'border-slate-300 bg-slate-100 font-semibold text-slate-800',
} as const;

export function ItemListDesktopFilters(props: ItemListDesktopFiltersProps) {
  return (
    <>
      <div className="hidden flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-1.5 text-xs md:flex">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[11px] font-medium text-slate-400">Availability:</span>
          {tagOptions.map(([tag, label, Icon, tone], index) => (
            <span key={tag} className="contents">
              {index === 2 && <span className="mx-0.5 text-slate-200">|</span>}
              <button
                type="button"
                onClick={() => props.onToggleTag(tag)}
                className={`inline-flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  props.allowedTags[tag]
                    ? activeClasses[tone]
                    : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3 w-3" /> {label}
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => props.onToggleTag('The Sea')}
            className={`inline-flex cursor-pointer items-center rounded border px-2 py-0.5 text-[11px] font-medium ${
              props.allowedTags['The Sea']
                ? 'border-teal-300 bg-teal-50 font-semibold text-teal-800'
                : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            🌊 The Sea
          </button>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={props.onThriftyOnly}
            className="cursor-pointer font-medium text-blue-600 hover:underline"
          >
            Thrifty Only
          </button>
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={props.onAllSources}
            className="cursor-pointer font-medium text-slate-500 hover:text-slate-800"
          >
            All Sources
          </button>
        </div>
      </div>

      <div className="hidden flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-1.5 text-xs md:flex">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto pb-0.5">
          <span className="mr-0.5 shrink-0 text-[11px] font-medium text-slate-400">Types:</span>
          {props.availableTypes.map((config) => {
            const Icon = config.icon;
            const enabled = props.allowedTypes[config.key];
            const count = props.typeCounts[config.key];
            return (
              <button
                type="button"
                key={config.key}
                onClick={() => props.onToggleType(config.key)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all ${
                  enabled
                    ? 'border-slate-800 bg-slate-800 font-semibold text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3 w-3" /> {config.label}
                {count > 0 && (
                  <span
                    className={`rounded-full px-1 text-[10px] ${enabled ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={props.onConsumablesOnly}
            className="cursor-pointer font-medium text-amber-700 hover:underline"
          >
            Consumables
          </button>
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={props.onGearOnly}
            className="cursor-pointer font-medium text-blue-600 hover:underline"
          >
            Gear
          </button>
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={props.onAllTypes}
            className="cursor-pointer font-medium text-slate-500 hover:text-slate-800"
          >
            All Types
          </button>
        </div>
      </div>
    </>
  );
}
