import { CLASSES, MOON_SIGNS } from '../../../data/constants';
import { assertTCRSRecordSet, type TCRSRecordSet } from '../domain/tcrsRecords';
import { isTCRSDataManifest, type TCRSDataManifest } from './dataManifest';
import {
  deserializeReferenceData,
  type ReferenceData,
  type SerializedReferenceData,
} from '../domain/referenceData';

const classIds = new Set(CLASSES.map(({ id }) => id));
const signIds = new Set(MOON_SIGNS.map(({ id }) => id));

export function assertValidSelection(className: string, moonSign: string): void {
  if (!classIds.has(className) || !signIds.has(moonSign)) {
    throw new Error('Unsupported class or moon-sign selection.');
  }
}

async function fetchRequired(url: string, signal?: AbortSignal): Promise<Response> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json, text/plain' } });
  if (!response.ok) throw new Error('Required static data could not be loaded.');
  return response;
}

export async function loadReferenceData(baseUrl: string, signal?: AbortSignal): Promise<ReferenceData> {
  const response = await fetchRequired(`${baseUrl}data/reference-data.json`, signal);
  return deserializeReferenceData((await response.json()) as SerializedReferenceData);
}

export async function loadDataManifest(baseUrl: string, signal?: AbortSignal): Promise<TCRSDataManifest> {
  const response = await fetchRequired(`${baseUrl}data/manifest.json`, signal);
  const manifest: unknown = await response.json();
  if (!isTCRSDataManifest(manifest)) throw new Error('The data manifest is invalid.');
  return manifest;
}

/** Fetch exactly one generated JSON dataset for the selected class and sign. */
export async function loadTCRSRecords(
  baseUrl: string,
  className: string,
  moonSign: string,
  signal?: AbortSignal,
): Promise<TCRSRecordSet> {
  assertValidSelection(className, moonSign);
  const url = `${baseUrl}data/generated/TCRS_${className}_${moonSign}.json`;
  const response = await fetchRequired(url, signal);
  const records: unknown = await response.json();
  assertTCRSRecordSet(records, className, moonSign);
  return records;
}
