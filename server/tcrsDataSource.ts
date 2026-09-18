import fs from 'node:fs';
import path from 'node:path';
import { TimedLruCache } from './timedLruCache';

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_UPSTREAM_BYTES = 2 * 1024 * 1024;
const upstreamCache = new TimedLruCache<string>(18, CACHE_TTL_MS);

async function readLimitedText(response: Response): Promise<string | null> {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPSTREAM_BYTES) return null;
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_UPSTREAM_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks).toString('utf8');
}

export async function getTCRSFileContent(filename: string): Promise<string | null> {
  const cached = upstreamCache.get(filename);
  if (cached) return cached;

  if (process.env.TCRS_OFFLINE !== 'true') {
    const githubUrl = `https://raw.githubusercontent.com/kolmafia/kolmafia/main/data/TCRS/${filename}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4_000);
    try {
      const response = await fetch(githubUrl, { signal: controller.signal });
      if (response.ok) {
        const text = await readLimitedText(response);
        if (text && text.trim().length > 50) {
          upstreamCache.set(filename, text);
          return text;
        }
      }
    } catch {
      // The bundled snapshot below keeps the service available without upstream access.
    } finally {
      clearTimeout(timeout);
    }
  }

  const localFile = path.join(process.cwd(), 'data', 'kolmafia', 'tcrs', filename);
  try {
    const content = fs.readFileSync(localFile, 'utf8');
    upstreamCache.set(filename, content);
    return content;
  } catch {
    console.error(JSON.stringify({ level: 'error', event: 'bundled_tcrs_read_failed' }));
    return null;
  }
}

export function clearTCRSDataSourceCache(): void {
  upstreamCache.clear();
}

export const TCRS_UPSTREAM_BYTE_LIMIT = MAX_UPSTREAM_BYTES;
