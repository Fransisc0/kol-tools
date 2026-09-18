import React from 'react';
import { Backpack, Ban, CheckCircle2, Hammer, Sparkles, Store, Utensils, Wine, Zap } from 'lucide-react';
import { TCRSItem } from '../types';
import { isUnchangedItem } from '../utils/itemUtils';

interface ItemMetadataBadgesProps {
  item: TCRSItem;
}

const badgeBase = 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0';

function TypeBadge({ item }: { item: TCRSItem }) {
  if (item.isCafe)
    return (
      <span className={`${badgeBase} bg-amber-50 text-amber-800`}>
        <Utensils className="w-2.5 h-2.5" />
        Cafe
      </span>
    );
  if (item.primaryUse === 'food')
    return (
      <span className={`${badgeBase} bg-emerald-50 text-emerald-800`}>
        <Utensils className="w-2.5 h-2.5" />
        Food
      </span>
    );
  if (item.primaryUse === 'drink' || item.primaryUse === 'booze')
    return (
      <span className={`${badgeBase} bg-indigo-50 text-indigo-800`}>
        <Wine className="w-2.5 h-2.5" />
        Booze
      </span>
    );
  if (item.isPotion)
    return (
      <span className={`${badgeBase} bg-blue-50 text-blue-800`}>
        <Sparkles className="w-2.5 h-2.5" />
        Potion
      </span>
    );
  if (item.primaryUse === 'container' || item.primaryUse === 'back')
    return (
      <span className={`${badgeBase} bg-slate-100 text-slate-700`}>
        <Backpack className="w-2.5 h-2.5" />
        Back
      </span>
    );
  return (
    <span className={`${badgeBase} bg-slate-100 text-slate-700`}>
      <Zap className="w-2.5 h-2.5" />
      {item.primaryUse || 'Item'}
    </span>
  );
}

export function ItemMetadataBadges({ item }: ItemMetadataBadgesProps) {
  const quality = (item.quality || '').trim();
  const isEpic = quality.toLowerCase().includes('epic');
  const isAwesome = quality.toLowerCase() === 'awesome';
  const sourceTitle = item.sourceDetails?.join(', ') || undefined;

  return (
    <div className="flex flex-wrap items-center gap-1 min-w-0">
      <TypeBadge item={item} />
      {isEpic && (
        <span
          className={`${badgeBase} bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300 font-bold uppercase`}
        >
          ★ EPIC
        </span>
      )}
      {isAwesome && <span className={`${badgeBase} bg-blue-50 text-blue-800`}>Awesome</span>}
      {!isEpic && !isAwesome && quality && (
        <span className={`${badgeBase} bg-slate-100 text-slate-700`}>{quality}</span>
      )}
      {item.size > 0 && (
        <span className={`${badgeBase} bg-slate-100 text-slate-600 font-mono`}>Sz: {item.size}</span>
      )}
      {item.tags.includes('Thrifty Accessible') && (
        <span
          title="Whitelisted for the Thrifty challenge path"
          className={`${badgeBase} bg-emerald-50 text-emerald-800`}
        >
          <CheckCircle2 className="w-2.5 h-2.5" />
          Thrifty
        </span>
      )}
      {item.tags.includes('Non-Thrifty') && (
        <span title="Not on the Thrifty whitelist" className={`${badgeBase} bg-rose-50 text-rose-800`}>
          <Ban className="w-2.5 h-2.5" />
          Non-Thrifty
        </span>
      )}
      {item.tags.includes('NPC Store') ? (
        <span title={sourceTitle} className={`${badgeBase} bg-sky-50 text-sky-800`}>
          <Store className="w-2.5 h-2.5" />
          Store
        </span>
      ) : item.tags.includes('Craftable') || item.tags.includes('Easily Craftable Recipe') ? (
        <span title={sourceTitle} className={`${badgeBase} bg-amber-50 text-amber-800`}>
          <Hammer className="w-2.5 h-2.5" />
          Craft
        </span>
      ) : item.tags.includes('The Sea') ? (
        <span title={sourceTitle} className={`${badgeBase} bg-teal-50 text-teal-800`}>
          Sea
        </span>
      ) : item.tags.includes('Drops / Other') ? (
        <span title={sourceTitle} className={`${badgeBase} bg-slate-100 text-slate-700`}>
          Drop
        </span>
      ) : null}
      {isUnchangedItem(item) && <span className={`${badgeBase} bg-slate-100 text-slate-500`}>Unchanged</span>}
    </div>
  );
}
