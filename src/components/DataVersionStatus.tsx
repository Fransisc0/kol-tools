import { Database } from 'lucide-react';

import type { TCRSDataManifest } from '../features/tcrs/data/dataManifest';

interface DataVersionStatusProps {
  manifest: TCRSDataManifest | null;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export function DataVersionStatus({ manifest }: DataVersionStatusProps) {
  if (!manifest) return null;

  const { revision, committedAt } = manifest.source;
  const dateLabel = committedAt ? dateFormatter.format(new Date(committedAt)) : 'bundled snapshot';
  const title = revision
    ? `KoLmafia data from ${committedAt ?? 'unknown date'} · commit ${revision}`
    : 'KoLmafia bundled data snapshot';
  const content = (
    <>
      <Database className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>KoLmafia data · {dateLabel}</span>
    </>
  );

  if (!revision) {
    return (
      <span
        className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-slate-500"
        title={title}
      >
        {content}
      </span>
    );
  }

  return (
    <a
      className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-slate-500 underline-offset-2 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
      href={`https://github.com/kolmafia/kolmafia/commit/${revision}`}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      aria-label={`${title}. Open the source commit.`}
    >
      {content}
    </a>
  );
}
