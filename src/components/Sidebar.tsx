import React, { useEffect, useRef } from 'react';
import { ClassSignSelector } from './ClassSignSelector';
import {
  AllowedTagKey,
  AllowedTags,
  BoozeQualityFilter,
  FoodQualityFilter,
  ItemTypeKey,
  ThriftyMode,
} from '../types';
import { CONSUMABLE_TYPE_CONFIGS, EQUIPMENT_TYPE_CONFIGS } from '../config/itemTypes';
import { Filter, Tag, Check, X, Layers, Utensils, Shield, Coins, Store } from 'lucide-react';
import { CLASSES, MOON_SIGNS } from '../data/constants';
import { ItemTypeFilterGroup } from './ItemTypeFilterGroup';
import { SidebarQualityFilters } from './SidebarQualityFilters';
import { UnchangedItemsToggle } from './UnchangedItemsToggle';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedClass: string;
  setSelectedClass: (val: string) => void;
  selectedSign: string;
  setSelectedSign: (val: string) => void;
  onlyEpicNpcCombo: boolean;
  setOnlyEpicNpcCombo: (val: boolean) => void;
  allowedTags: AllowedTags;
  toggleTag: (tag: AllowedTagKey) => void;
  thriftyMode?: ThriftyMode;
  setThriftyMode?: (mode: ThriftyMode) => void;
  allowedTypes: Record<ItemTypeKey, boolean>;
  toggleType: (type: ItemTypeKey) => void;
  showUnchangedItems: boolean;
  setShowUnchangedItems: (val: boolean) => void;
  foodQualityFilter?: FoodQualityFilter;
  setFoodQualityFilter?: (filter: FoodQualityFilter) => void;
  boozeQualityFilter?: BoozeQualityFilter;
  setBoozeQualityFilter?: (filter: BoozeQualityFilter) => void;
  onResetFilters?: () => void;
}

const SOURCE_TAGS = ['NPC Store', 'Craftable', 'Drops / Other', 'The Sea'] as const;

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  selectedClass,
  setSelectedClass,
  selectedSign,
  setSelectedSign,
  onlyEpicNpcCombo,
  setOnlyEpicNpcCombo,
  allowedTags,
  toggleTag,
  thriftyMode,
  setThriftyMode,
  allowedTypes,
  toggleType,
  showUnchangedItems,
  setShowUnchangedItems,
  foodQualityFilter,
  setFoodQualityFilter,
  boozeQualityFilter,
  setBoozeQualityFilter,
  onResetFilters,
}: SidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  // Lock background scrolling and manage focus
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const currentClassObj = CLASSES.find((c) => c.id === selectedClass);
  const currentSignObj = MOON_SIGNS.find((s) => s.id === selectedSign);

  return (
    <>
      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close settings drawer backdrop"
        />
      )}

      {/* Pop-up Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Character Setup & Filters"
        className={`fixed top-0 left-0 bottom-0 z-50 w-full max-w-[90vw] sm:max-w-[540px] md:max-w-[600px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="settings-drawer-aside"
      >
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                Character Setup & Filters
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                {currentClassObj?.name} • {currentSignObj?.name} ({currentSignObj?.areaAccess})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs text-slate-500 hover:text-blue-600 font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reset all filters to default"
              >
                Reset
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Close drawer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-7">
          {/* Class and Moon Sign Selection Component */}
          <ClassSignSelector
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
            selectedSign={selectedSign}
            onSelectSign={setSelectedSign}
            onlyEpicNpcCombo={onlyEpicNpcCombo}
            setOnlyEpicNpcCombo={setOnlyEpicNpcCombo}
          />

          <div className="h-px bg-slate-200 my-4" />

          {/* 3. Availability Filters */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" />
                3. Availability Filters
              </span>
            </div>

            {/* Subsection: Thriftiness */}
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  Thriftiness
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (setThriftyMode) {
                      setThriftyMode('all');
                    } else {
                      if (!allowedTags['Thrifty Accessible']) toggleTag('Thrifty Accessible');
                      if (!allowedTags['Non-Thrifty']) toggleTag('Non-Thrifty');
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                    (
                      thriftyMode
                        ? thriftyMode === 'all'
                        : allowedTags['Thrifty Accessible'] && allowedTags['Non-Thrifty']
                    )
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Both
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (setThriftyMode) {
                      setThriftyMode('thrifty');
                    } else {
                      if (!allowedTags['Thrifty Accessible']) toggleTag('Thrifty Accessible');
                      if (allowedTags['Non-Thrifty']) toggleTag('Non-Thrifty');
                    }
                  }}
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg border font-semibold text-xs transition-all ${
                    (
                      thriftyMode
                        ? thriftyMode === 'thrifty'
                        : allowedTags['Thrifty Accessible'] && !allowedTags['Non-Thrifty']
                    )
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Thrifty
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (setThriftyMode) {
                      setThriftyMode('non-thrifty');
                    } else {
                      if (allowedTags['Thrifty Accessible']) toggleTag('Thrifty Accessible');
                      if (!allowedTags['Non-Thrifty']) toggleTag('Non-Thrifty');
                    }
                  }}
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg border font-semibold text-xs transition-all ${
                    (
                      thriftyMode
                        ? thriftyMode === 'non-thrifty'
                        : !allowedTags['Thrifty Accessible'] && allowedTags['Non-Thrifty']
                    )
                      ? 'bg-amber-600 border-amber-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Non-Thrifty
                </button>
              </div>
            </div>

            {/* Subsection: Item Sources */}
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  Item Sources
                </span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      SOURCE_TAGS.forEach((tag) => {
                        if (!allowedTags[tag]) toggleTag(tag);
                      });
                    }}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      SOURCE_TAGS.forEach((tag) => {
                        if (allowedTags[tag]) toggleTag(tag);
                      });
                    }}
                    className="font-semibold text-slate-500 hover:underline"
                  >
                    None
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {SOURCE_TAGS.map((tag) => {
                  const isAllowed = allowedTags[tag] ?? true;
                  return (
                    <label
                      key={tag}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        isAllowed
                          ? 'bg-blue-50/70 border-blue-200 text-slate-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-3.5 h-3.5 rounded shadow-2xs border transition-colors shrink-0 ${
                          isAllowed
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isAllowed}
                        onChange={() => toggleTag(tag)}
                      />
                      <span className="text-xs truncate">{tag}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 my-4" />

          {/* 4. Item Types */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-blue-600" />
                4. Item Types
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    [...CONSUMABLE_TYPE_CONFIGS, ...EQUIPMENT_TYPE_CONFIGS].forEach((cfg) => {
                      if (!allowedTypes[cfg.key]) toggleType(cfg.key);
                    });
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                >
                  All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    [...CONSUMABLE_TYPE_CONFIGS, ...EQUIPMENT_TYPE_CONFIGS].forEach((cfg) => {
                      if (allowedTypes[cfg.key]) toggleType(cfg.key);
                    });
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  None
                </button>
              </div>
            </div>

            <ItemTypeFilterGroup
              title="Consumables"
              icon={Utensils}
              iconClassName="text-amber-600"
              options={CONSUMABLE_TYPE_CONFIGS}
              allowedTypes={allowedTypes}
              onToggle={toggleType}
              columns="grid-cols-2 sm:grid-cols-3"
            />

            <ItemTypeFilterGroup
              title="Equipment"
              icon={Shield}
              iconClassName="text-blue-600"
              options={EQUIPMENT_TYPE_CONFIGS}
              allowedTypes={allowedTypes}
              onToggle={toggleType}
              columns="grid-cols-2 sm:grid-cols-4"
            />

            <SidebarQualityFilters
              foodQualityFilter={foodQualityFilter}
              setFoodQualityFilter={setFoodQualityFilter}
              boozeQualityFilter={boozeQualityFilter}
              setBoozeQualityFilter={setBoozeQualityFilter}
            />

            <UnchangedItemsToggle checked={showUnchangedItems} onChange={setShowUnchangedItems} />
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-5 py-3 flex items-center justify-between gap-3 shrink-0">
          {onResetFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <div className="text-xs text-slate-500 hidden sm:block">Setup saved automatically.</div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all text-center focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            Done & View Items
          </button>
        </div>
      </aside>
    </>
  );
}
