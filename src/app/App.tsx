import React, { useState, useMemo } from 'react';
import {
  DEFAULT_ALLOWED_TYPES,
  DEFAULT_ALLOWED_TAGS,
  DEFAULT_THRIFTY_MODE,
  DEFAULT_FOOD_QUALITY_FILTER,
  DEFAULT_BOOZE_QUALITY_FILTER,
  DEFAULT_SHOW_UNCHANGED_ITEMS,
} from '../types';
import type { ItemTypeKey } from '../components/ItemList';
import { useTCRSData } from '../features/tcrs/hooks/useTCRSData';
import { useDataManifest } from '../features/tcrs/hooks/useDataManifest';
import { usePreferences } from '../hooks/usePreferences';
import { MainSectionTabs } from '../components/MainSectionTabs';
import { MainContent } from '../components/MainContent';
import { Sidebar } from '../components/Sidebar';
import { Loader2, Layers, AlertCircle } from 'lucide-react';
import { CLASSES, MOON_SIGNS } from '../data/constants';
import { DataVersionStatus } from '../components/DataVersionStatus';

export default function App() {
  const [selectedClass, setSelectedClass] = useState<string>('Seal_Clubber');
  const [selectedSign, setSelectedSign] = useState<string>('Mongoose');
  const { data, loading, error, isProcessingSlow, retry } = useTCRSData(selectedClass, selectedSign);
  const dataManifest = useDataManifest();

  const [activeSection, setActiveSection] = useState<string>('turn-generation');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('food');
  const [onlyEpicNpcCombo, setOnlyEpicNpcCombo] = useState<boolean>(false);
  const [groupingMode, setGroupingMode] = useState<'Purpose' | 'NPC Store' | 'Zone' | 'All'>('Purpose');

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const {
    itemLayout,
    setItemLayout,
    allowedTags,
    setAllowedTags,
    thriftyMode,
    setThriftyMode,
    allowedTypes,
    setAllowedTypes,
    showUnchangedItems,
    setShowUnchangedItems,
    foodQualityFilter,
    setFoodQualityFilter,
    boozeQualityFilter,
    setBoozeQualityFilter,
    toggleTag,
    toggleType,
    resetFilters,
  } = usePreferences();

  const handleResetFilters = () => {
    setOnlyEpicNpcCombo(false);
    resetFilters();
  };

  const currentClass = CLASSES.find((c) => c.id === selectedClass) || CLASSES[0];
  const currentSign = MOON_SIGNS.find((s) => s.id === selectedSign) || MOON_SIGNS[0];

  // Calculate active filter count for mobile badge (strictly comparing against canonical defaults)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (onlyEpicNpcCombo) count++;
    if (thriftyMode !== DEFAULT_THRIFTY_MODE) count++;
    if (showUnchangedItems !== DEFAULT_SHOW_UNCHANGED_ITEMS) count++;
    if (foodQualityFilter !== DEFAULT_FOOD_QUALITY_FILTER) count++;
    if (boozeQualityFilter !== DEFAULT_BOOZE_QUALITY_FILTER) count++;

    // Check if item types have been modified away from default
    const hasTypeChanges = (Object.keys(DEFAULT_ALLOWED_TYPES) as ItemTypeKey[]).some(
      (key) => allowedTypes[key] !== DEFAULT_ALLOWED_TYPES[key],
    );
    if (hasTypeChanges) count++;

    // Check if tags have been modified away from default
    const hasTagChanges = (Object.keys(DEFAULT_ALLOWED_TAGS) as (keyof typeof DEFAULT_ALLOWED_TAGS)[]).some(
      (key) => allowedTags[key] !== DEFAULT_ALLOWED_TAGS[key],
    );
    if (hasTagChanges) count++;

    return count;
  }, [
    onlyEpicNpcCombo,
    thriftyMode,
    showUnchangedItems,
    foodQualityFilter,
    boozeQualityFilter,
    allowedTypes,
    allowedTags,
  ]);

  const handleSelectSection = (section: string) => {
    setActiveSection(section);
    if (section === 'turn-generation') setActiveSubCategory('food');
    else if (section === 'buffs') setActiveSubCategory('noncombat');
    else if (groupingMode === 'NPC Store' || groupingMode === 'Zone') {
      setActiveSubCategory('__ALL__');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/50 text-slate-800 font-sans flex flex-col antialiased relative">
      {/* Top Navigation Bar - Responsive header without clipping */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs shrink-0">
        <div className="w-full px-3 sm:px-4 py-2.5 sm:py-0 sm:h-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          {/* Mobile Row 1 / Desktop Left: Class & Sign setup button with change badge */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              id="header-setup-button"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer min-w-0 max-w-full"
              title="Configure Class, Moon Sign, and Filters"
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-900 truncate">{currentClass.name}</span>
              <span className="text-slate-300 shrink-0">/</span>
              <span className="text-slate-700 font-medium truncate">{currentSign.name}</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold shrink-0 ml-0.5">
                Change
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="font-semibold text-slate-600 sm:font-normal">TCRS Viewer</span>
              <span className="text-slate-300 hidden md:inline">·</span>
              <span className="hidden md:inline-flex">
                <DataVersionStatus manifest={dataManifest} />
              </span>
            </div>
          </div>

          {/* Mobile Row 2 / Desktop Right: Group By Dropdown */}
          <div className="flex w-full sm:w-auto sm:max-w-xs items-center gap-2 min-w-0">
            <label className="text-xs font-bold text-slate-500 whitespace-nowrap shrink-0">Group By:</label>
            <select
              value={groupingMode}
              onChange={(e) => {
                const val = e.target.value as 'Purpose' | 'NPC Store' | 'Zone' | 'All';
                setGroupingMode(val);
                if (val === 'Purpose') {
                  setActiveSection('turn-generation');
                  setActiveSubCategory('food');
                } else if (val === 'NPC Store') {
                  setActiveSection('Early Game Stores');
                  setActiveSubCategory('__NONE__');
                } else if (val === 'Zone') {
                  setActiveSection('L3: Typical Tavern');
                  setActiveSubCategory('__NONE__');
                } else if (val === 'All') {
                  setActiveSection('All Items');
                  setActiveSubCategory('All Items');
                }
              }}
              className="p-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full font-medium cursor-pointer"
            >
              <option value="Purpose">Purpose</option>
              <option value="NPC Store">NPC Store</option>
              <option value="Zone">Zone</option>
              <option value="All">All</option>
            </select>
          </div>
        </div>
      </header>

      {/* Left-tab Pop Up Drawer */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedSign={selectedSign}
        setSelectedSign={setSelectedSign}
        onlyEpicNpcCombo={onlyEpicNpcCombo}
        setOnlyEpicNpcCombo={setOnlyEpicNpcCombo}
        allowedTags={allowedTags}
        toggleTag={toggleTag}
        thriftyMode={thriftyMode}
        setThriftyMode={setThriftyMode}
        allowedTypes={allowedTypes}
        toggleType={toggleType}
        showUnchangedItems={showUnchangedItems}
        setShowUnchangedItems={setShowUnchangedItems}
        foodQualityFilter={foodQualityFilter}
        setFoodQualityFilter={setFoodQualityFilter}
        boozeQualityFilter={boozeQualityFilter}
        setBoozeQualityFilter={setBoozeQualityFilter}
        onResetFilters={handleResetFilters}
      />

      {/* Main Content Area - Mobile-first gutters (10px to 14px on phones, spacious on desktop) */}
      <div className="flex flex-1 w-full max-w-[1600px] mx-auto min-h-0">
        <main className="flex-1 min-w-0 px-2.5 py-2.5 sm:px-4 sm:py-3.5 lg:p-6 flex flex-col sm:h-[calc(100vh-3.5rem)] overflow-y-auto sm:overflow-hidden bg-slate-50/50">
          <MainSectionTabs
            groupingMode={groupingMode}
            activeSection={activeSection}
            handleSelectSection={handleSelectSection}
          />

          {loading && data && (
            <div
              className="mb-2 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800"
              role="status"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Updating results for {currentClass.name} and {currentSign.name}…
            </div>
          )}

          {error && !data ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold">Error loading data</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={retry}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : loading && !data ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 sm:py-32 text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
              <p className="font-medium text-sm text-center px-4">
                Loading TCRS data for {currentClass.name} ({currentSign.name})…
              </p>
              {isProcessingSlow && (
                <div
                  className="mt-3 max-w-md px-5 text-center text-xs leading-relaxed text-slate-500"
                  role="status"
                >
                  Loading and processing this dataset is taking a little longer than usual.
                  <button
                    type="button"
                    onClick={retry}
                    className="ml-1 font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800"
                  >
                    Retry now
                  </button>
                </div>
              )}
            </div>
          ) : !data ? null : (
            <MainContent
              data={data}
              groupingMode={groupingMode}
              activeSubCategory={activeSubCategory}
              setActiveSubCategory={setActiveSubCategory}
              activeSection={activeSection}
              allowedTags={allowedTags}
              setAllowedTags={setAllowedTags}
              allowedTypes={allowedTypes}
              setAllowedTypes={setAllowedTypes}
              showUnchangedItems={showUnchangedItems}
              foodQualityFilter={foodQualityFilter}
              setFoodQualityFilter={setFoodQualityFilter}
              boozeQualityFilter={boozeQualityFilter}
              setBoozeQualityFilter={setBoozeQualityFilter}
              itemLayout={itemLayout}
              setItemLayout={setItemLayout}
              onOpenFilters={() => setSidebarOpen(true)}
              activeFilterCount={activeFilterCount}
            />
          )}
        </main>
      </div>
    </div>
  );
}
