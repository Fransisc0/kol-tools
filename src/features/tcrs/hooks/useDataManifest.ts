import { useEffect, useState } from 'react';

import type { TCRSDataManifest } from '../data/dataManifest';
import { loadDataManifest } from '../data/staticData';

export function useDataManifest(): TCRSDataManifest | null {
  const [manifest, setManifest] = useState<TCRSDataManifest | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadDataManifest(import.meta.env.BASE_URL, controller.signal)
      .then(setManifest)
      .catch(() => {
        // Dataset loading reports actionable failures; version metadata is supplementary.
      });
    return () => controller.abort();
  }, []);

  return manifest;
}
