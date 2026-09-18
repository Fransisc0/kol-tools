import React from 'react';
import { TCRSItem } from '../types';
import { ItemDisplayModel } from '../utils/itemDisplay';

interface ItemIdentityProps {
  item: TCRSItem;
  display: ItemDisplayModel;
  variant: 'row' | 'card';
}

export function ItemIdentity({ item, display, variant }: ItemIdentityProps) {
  const titleSize = variant === 'card' ? 'text-sm sm:text-base' : 'text-[13px]';

  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-1.5 min-w-0">
        <h4
          className={`font-bold text-slate-900 group-hover:text-blue-700 transition-colors ${titleSize} leading-tight truncate`}
          title={item.origName}
        >
          {item.origName}
        </h4>
        <span className="text-slate-400 font-mono text-[10px] shrink-0">#{item.id}</span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 min-w-0 text-[11px] leading-tight">
        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 shrink-0">TCRS</span>
        {display.isNameUnchanged ? (
          <span className="text-slate-400 font-medium">· Unchanged</span>
        ) : (
          <span className="text-slate-600 font-medium truncate" title={item.tcrsName}>
            {item.tcrsName}
          </span>
        )}
      </div>
    </div>
  );
}
