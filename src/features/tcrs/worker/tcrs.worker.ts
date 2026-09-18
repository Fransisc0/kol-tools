/// <reference lib="webworker" />

import type { TCRSDataResponse } from '../../../types';
import { loadReferenceData, loadTCRSFiles } from '../data/staticData';
import { parseTCRSData } from '../domain/parser';
import type { ReferenceData } from '../domain/referenceData';
import type { ParseRequest, ParseResponse } from './protocol';
import { RecentDatasetCache } from './recentDatasetCache';

const workerScope = self as DedicatedWorkerGlobalScope;
const responseCache = new RecentDatasetCache<TCRSDataResponse>(2);
const inFlight = new Map<string, Promise<TCRSDataResponse>>();
let referencesPromise: Promise<ReferenceData> | undefined;

async function load(request: ParseRequest): Promise<TCRSDataResponse> {
  const key = `${request.className}_${request.moonSign}`;
  const cached = responseCache.get(key);
  if (cached) return cached;
  const existing = inFlight.get(key);
  if (existing) return existing;

  referencesPromise ??= loadReferenceData(request.baseUrl);
  const pending = Promise.all([
    referencesPromise,
    loadTCRSFiles(request.baseUrl, request.className, request.moonSign),
  ])
    .then(([references, files]) => parseTCRSData(request.className, request.moonSign, files, references))
    .then((data) => {
      responseCache.set(key, data);
      return data;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}

workerScope.addEventListener('message', (event: MessageEvent<ParseRequest>) => {
  const request = event.data;
  if (request.type !== 'parse') return;
  void load(request)
    .then((data) => {
      const response: ParseResponse = { type: 'success', requestId: request.requestId, data };
      workerScope.postMessage(response);
    })
    .catch(() => {
      const response: ParseResponse = {
        type: 'error',
        requestId: request.requestId,
        message: 'Failed to load or process this TCRS dataset.',
      };
      workerScope.postMessage(response);
    });
});
