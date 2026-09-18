import React, { useState } from 'react';
import { Check, ChevronDown, Clock, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { TCRSItem } from '../types';
import { copyToClipboard } from '../utils/itemUtils';
import { getItemDisplayModel } from '../utils/itemDisplay';
import { ItemIdentity } from './ItemIdentity';
import { ItemMetadataBadges } from './ItemMetadataBadges';

interface ItemRowProps {
  item: TCRSItem;
}

export const ItemRow: React.FC<ItemRowProps> = ({ item }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const display = getItemDisplayModel(item);
  const isEpic = (item.quality || '').toLowerCase().includes('epic');

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (await copyToClipboard(item.tcrsName)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div
      id={`item-row-${item.id}`}
      className={`group rounded-lg bg-white px-2.5 py-1.5 sm:px-3 transition-all duration-150 ring-1 ring-inset ${
        isEpic
          ? 'ring-amber-200 hover:bg-amber-50/30 hover:shadow-xs'
          : 'ring-slate-200 hover:bg-slate-50/70 hover:shadow-xs'
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(190px,1.15fr)_auto_minmax(140px,1fr)_auto] items-center gap-1.5 sm:gap-2">
        <div className="min-w-0">
          <ItemIdentity item={item} display={display} variant="row" />
        </div>

        <ItemMetadataBadges item={item} />

        <div className="min-w-0 sm:border-l sm:border-slate-100 sm:pl-2">
          {display.primaryResult ? (
            <div
              className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-700"
              aria-label={display.primaryResult.accessibleText}
            >
              {display.primaryResult.kind === 'effect' && (
                <Sparkles className="w-3 h-3 shrink-0 text-blue-500" />
              )}
              <span
                className="flex min-w-0 items-baseline gap-1 truncate"
                title={display.primaryResult.accessibleText || display.primaryResult.label}
              >
                <span
                  className={`shrink-0 ${display.primaryResult.kind === 'effect' ? 'font-semibold text-blue-700' : 'font-medium'}`}
                >
                  {display.primaryResult.label}
                </span>
                {display.primaryResult.modifierSummary && (
                  <span className="truncate text-[10px] font-medium text-slate-500">
                    <span aria-hidden="true" className="px-0.5 text-slate-300">
                      ·
                    </span>
                    {display.primaryResult.modifierSummary}
                  </span>
                )}
              </span>
              {display.primaryResult.duration !== undefined && (
                <span className="inline-flex shrink-0 items-center gap-0.5 font-mono text-[10px] text-slate-400">
                  <Clock className="w-2.5 h-2.5" />
                  {display.primaryResult.duration}t
                </span>
              )}
              {display.primaryResult.value && (
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                  {display.primaryResult.value}
                </span>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-0.5">
          {display.hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              title={expanded ? 'Hide item details' : 'Show item details'}
              aria-label={`${expanded ? 'Hide' : 'Show'} details for ${item.origName}`}
              aria-expanded={expanded}
              className="inline-flex min-h-[44px] min-w-[44px] sm:min-h-[30px] sm:min-w-[30px] items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button
            id={`copy-item-row-${item.id}`}
            type="button"
            onClick={handleCopy}
            title="Copy TCRS name"
            aria-label={`Copy TCRS name ${item.tcrsName}`}
            className="inline-flex min-h-[44px] min-w-[44px] sm:min-h-[30px] sm:min-w-[30px] items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <a
            href={`https://wiki.kingdomofloathing.com/${encodeURIComponent(item.origName.replace(/ /g, '_'))}`}
            target="_blank"
            rel="noreferrer"
            title={`View original item ${item.origName} on KoL Wiki`}
            aria-label={`View original item ${item.origName} on KoL Wiki`}
            className="inline-flex min-h-[44px] min-w-[44px] sm:min-h-[30px] sm:min-w-[30px] items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {expanded && display.hasDetails && (
        <div className="mt-1.5 grid gap-1.5 border-t border-slate-100 pt-1.5 text-[10px] sm:grid-cols-3">
          {display.effectModifiers && (
            <DetailGroup label="Effect modifiers" value={display.effectModifiers} tone="blue" />
          )}
          {display.itemModifiers && (
            <DetailGroup label="Item modifiers" value={display.itemModifiers} tone="slate" />
          )}
          {display.sources.length > 0 && (
            <DetailGroup label="Sources" value={display.sources.join(' · ')} tone="amber" />
          )}
        </div>
      )}
    </div>
  );
};

function DetailGroup({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'slate' | 'amber';
}) {
  const tones = {
    blue: 'bg-blue-50/70 text-blue-900',
    slate: 'bg-slate-50 text-slate-700',
    amber: 'bg-amber-50/70 text-amber-900',
  };
  return (
    <div className={`min-w-0 rounded-md px-2 py-1 ${tones[tone]}`}>
      <span className="mr-1 font-bold uppercase tracking-wide opacity-60">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
