import React from 'react';
import { Utensils, Zap, Store } from 'lucide-react';

interface MainSectionTabsProps {
  groupingMode: string;
  activeSection: string;
  handleSelectSection: (section: string) => void;
}

export function MainSectionTabs({ groupingMode, activeSection, handleSelectSection }: MainSectionTabsProps) {
  if (groupingMode === 'Purpose') {
    const sections = [
      { id: 'turn-generation', label: 'Turn Generation', icon: Utensils },
      { id: 'buffs', label: 'Buffs', icon: Zap },
    ];
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-xs mb-2 shrink-0">
        <div className="grid grid-cols-2 gap-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => handleSelectSection(id)}
              className={`flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-all sm:text-xs ${
                activeSection === id
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/25'
                  : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (groupingMode === 'NPC Store') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-xs mb-2 sm:mb-3 shrink-0">
        <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center">
          {[
            { id: 'Early Game Stores', label: 'Early Game' },
            { id: 'Moonsign Stores', label: 'Moonsign' },
            { id: 'Guild Stores', label: 'Guild' },
            { id: 'Quest Stores', label: 'Quest' },
            { id: 'Other NPC Stores', label: 'Other' },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => handleSelectSection(tab.id)}
              className={`flex flex-1 min-w-[95px] sm:min-w-[120px] items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/25'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (groupingMode === 'Zone') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-xs mb-2 sm:mb-3 shrink-0">
        <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center">
          {[
            { id: 'L3: Typical Tavern', label: 'L3' },
            { id: 'L4: Bat Hole', label: 'L4' },
            { id: "L5: Cobb's Knob", label: 'L5' },
            { id: 'L6: Deep Fat Friars / Steel Organ', label: 'L6' },
            { id: 'L7: Defiled Cyrpt', label: 'L7' },
            { id: 'L8: McLargeHuge', label: 'L8' },
            { id: 'L9: Orc Chasm', label: 'L9' },
            { id: "L10: Giant's Trash", label: 'L10' },
            { id: 'L11: Holy MacGuffin', label: 'L11' },
            { id: 'L12: Island War', label: 'L12' },
            { id: "L13: Sorceress's Tower", label: 'L13' },
            { id: '8-Bit Realm', label: '8-Bit' },
            { id: 'Early Spookyraven', label: 'Spooky' },
            { id: 'Misc IOTM', label: 'IOTM' },
            { id: 'Misc Maybe Useful?', label: 'Useful' },
            { id: 'Other / Miscellaneous', label: 'Other' },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => handleSelectSection(tab.id)}
              className={`flex flex-1 min-w-[55px] sm:min-w-[75px] items-center justify-center gap-1 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[11px] font-bold transition-all min-h-[34px] cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/25'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
