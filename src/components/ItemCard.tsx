import React, { useState } from 'react';
import { Check, Clock, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { TCRSItem } from '../types';
import { copyToClipboard } from '../utils/itemUtils';
import { getItemDisplayModel } from '../utils/itemDisplay';
import { ItemIdentity } from './ItemIdentity';
import { ItemMetadataBadges } from './ItemMetadataBadges';

interface ItemCardProps {
  item: TCRSItem;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const [copied, setCopied] = useState(false);
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
    <article
      id={`item-${item.id}`}
      className={`group flex flex-col rounded-xl bg-white p-3 transition-all duration-150 ring-1 ring-inset hover:shadow-sm ${
        isEpic ? 'ring-amber-200 hover:bg-amber-50/20' : 'ring-slate-200 hover:bg-slate-50/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <ItemIdentity item={item} display={display} variant="card" />
        </div>
        <button
          id={`copy-item-${item.id}`}
          type="button"
          onClick={handleCopy}
          title="Copy TCRS name"
          aria-label={`Copy TCRS name ${item.tcrsName}`}
          className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="mt-2">
        <ItemMetadataBadges item={item} />
      </div>

      {display.primaryResult && (
        <div className="mt-2 flex min-w-0 items-center gap-1.5 rounded-lg bg-blue-50/70 px-2.5 py-1.5 text-xs text-blue-900">
          {display.primaryResult.kind === 'effect' && (
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-500" />
          )}
          <span className="truncate font-semibold" title={display.primaryResult.label}>
            {display.primaryResult.label}
          </span>
          {display.primaryResult.duration !== undefined && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 font-mono text-[10px] text-slate-500">
              <Clock className="w-2.5 h-2.5" />
              {display.primaryResult.duration}t
            </span>
          )}
          {display.primaryResult.value && (
            <span className="ml-auto shrink-0 rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 shadow-xs">
              {display.primaryResult.value}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex-1 space-y-1.5 text-[10px]">
        {display.effectModifiers && <CardDetail label="Effect modifiers" value={display.effectModifiers} />}
        {display.itemModifiers && <CardDetail label="Item modifiers" value={display.itemModifiers} />}
        {display.sources.length > 0 && <CardDetail label="Sources" value={display.sources.join(' · ')} />}
      </div>

      <div className="mt-2 flex items-center justify-end border-t border-slate-100 pt-1.5">
        <a
          href={`https://wiki.kingdomofloathing.com/${encodeURIComponent(item.origName.replace(/ /g, '_'))}`}
          target="_blank"
          rel="noreferrer"
          title={`View original item ${item.origName} on KoL Wiki`}
          aria-label={`View original item ${item.origName} on KoL Wiki`}
          className="inline-flex min-h-[34px] items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Wiki <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
};

function CardDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1.5 text-slate-600">
      <span className="mb-0.5 block font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="font-mono leading-relaxed">{value}</span>
    </div>
  );
}
