import React from 'react';
import {
  CLASSES,
  MOON_SIGNS,
  hasEpicNpcFoodAndBooze,
  classHasAnyEpicNpcSign,
  getEpicNpcSignCount,
} from '../data/constants';
import { Award, ChevronRight, User, Moon, Sparkles } from 'lucide-react';
import { StatType } from '../types';

interface ClassSignSelectorProps {
  selectedClass: string;
  selectedSign: string;
  onSelectClass: (classId: string) => void;
  onSelectSign: (signId: string) => void;
  isLoading?: boolean;
  onlyEpicNpcCombo?: boolean;
  setOnlyEpicNpcCombo?: (val: boolean) => void;
}

export const ClassSignSelector: React.FC<ClassSignSelectorProps> = ({
  selectedClass,
  selectedSign,
  onSelectClass,
  onSelectSign,
  isLoading,
  onlyEpicNpcCombo,
  setOnlyEpicNpcCombo,
}) => {
  const currentClass = CLASSES.find((c) => c.id === selectedClass) || CLASSES[0];
  const currentSign = MOON_SIGNS.find((s) => s.id === selectedSign) || MOON_SIGNS[0];

  const currentSignQualifies = hasEpicNpcFoodAndBooze(selectedClass, selectedSign);

  const getStatBadge = (stat: StatType) => {
    switch (stat) {
      case 'Muscle':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            Muscle
          </span>
        );
      case 'Mysticality':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Mysticality
          </span>
        );
      case 'Moxie':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Moxie
          </span>
        );
    }
  };

  const getCampBadge = (area: string) => {
    if (area.includes('Knoll')) {
      return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          Knoll
        </span>
      );
    }
    if (area.includes('Canadia')) {
      return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
          Canadia
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
        Gnomads
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Filter for EPIC NPC Combos Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50/60 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs">
        <div className="flex items-start gap-2.5 pr-2">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs sm:text-sm font-bold text-emerald-950 block">
              Filter for EPIC NPC Combos
            </span>
            <span className="text-[11px] text-emerald-700 leading-tight block">
              Highlights class & sign pairings with early game NPC-store access to EPIC food & booze.
            </span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={onlyEpicNpcCombo}
            onChange={(e) => setOnlyEpicNpcCombo && setOnlyEpicNpcCombo(e.target.checked)}
          />
          <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* 2. Active Setup Summary Bar */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-700 flex-wrap">
          <Award className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-slate-500">Active Setup:</span>
          <span className="font-bold text-slate-900">{currentClass.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-bold text-slate-900">{currentSign.name}</span>
          <span className="text-slate-500 font-medium">({currentSign.areaAccess})</span>
          {onlyEpicNpcCombo && currentSignQualifies && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              ✓ EPIC Food & Booze
            </span>
          )}
        </div>
        <div className="text-slate-600 font-medium text-[11px]">
          Perk: <span className="text-slate-800 font-semibold">{currentSign.bonus}</span>
        </div>
      </div>

      {/* 3. Class Selection */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" />
            Class Picker
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{currentClass.name}</span>
            {getStatBadge(currentClass.stat)}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CLASSES.map((cls) => {
            const active = cls.id === selectedClass;
            const hasQualifying = classHasAnyEpicNpcSign(cls.id);
            const signCount = getEpicNpcSignCount(cls.id);
            const isGreyedOut = onlyEpicNpcCombo && !hasQualifying;

            return (
              <button
                type="button"
                key={cls.id}
                id={`select-class-${cls.id}`}
                onClick={() => onSelectClass(cls.id)}
                disabled={isLoading}
                className={`p-3 rounded-xl text-left border transition-all relative flex flex-col justify-between min-h-[72px] ${
                  isGreyedOut
                    ? 'opacity-40 grayscale bg-slate-100/80 border-dashed border-slate-300 text-slate-400 hover:opacity-70'
                    : active
                      ? 'bg-blue-50/90 border-blue-600 text-blue-950 ring-2 ring-blue-500/30 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="font-bold text-xs sm:text-sm leading-tight text-slate-900">
                    {cls.name}
                  </span>
                  {active && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">{cls.stat}</span>
                  {onlyEpicNpcCombo && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        hasQualifying ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {hasQualifying ? `${signCount} signs` : '0 signs'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Moon Sign Selection */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-blue-600" />
            Moonsign Picker
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{currentSign.name}</span>
            <span className="text-sm">{currentSign.zodiacSymbol}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {MOON_SIGNS.map((sign) => {
            const active = sign.id === selectedSign;
            const qualifies = hasEpicNpcFoodAndBooze(selectedClass, sign.id);
            const isGreyedOut = onlyEpicNpcCombo && !qualifies;

            return (
              <button
                type="button"
                key={sign.id}
                id={`select-sign-${sign.id}`}
                onClick={() => onSelectSign(sign.id)}
                disabled={isLoading}
                className={`p-2.5 sm:p-3 rounded-xl text-left border transition-all relative flex flex-col justify-between min-h-[82px] ${
                  isGreyedOut
                    ? 'opacity-35 grayscale bg-slate-100/80 border-dashed border-slate-300 text-slate-400 hover:opacity-70'
                    : active
                      ? 'bg-blue-50/90 border-blue-600 text-blue-950 ring-2 ring-blue-500/30 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg leading-none">{sign.zodiacSymbol}</span>
                    {getCampBadge(sign.areaAccess)}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                    {sign.name.replace(/^The\s+/, '')}
                  </div>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span className="font-medium text-slate-600 truncate">+10% {sign.statGroup}</span>
                  {onlyEpicNpcCombo && qualifies && (
                    <span className="text-[9px] text-emerald-800 font-extrabold bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300">
                      EPIC
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
