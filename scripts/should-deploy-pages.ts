import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';

import { shouldDeployPages } from './data/deploymentDecision';

const manifestPath = path.join(process.cwd(), 'public', 'data', 'manifest.json');
const localManifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { dataFingerprint?: unknown };
if (typeof localManifest.dataFingerprint !== 'string') {
  throw new Error('The local Pages manifest is missing its data fingerprint.');
}

let publishedFingerprint: unknown;
let reason = 'application change or manual deployment';
if (process.env.GITHUB_EVENT_NAME === 'schedule') {
  try {
    const response = await fetch('https://fransisc0.github.io/kol-tools/tcrs/data/manifest.json', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('published manifest unavailable');
    const publishedManifest = (await response.json()) as { dataFingerprint?: unknown };
    publishedFingerprint = publishedManifest.dataFingerprint;
    reason =
      publishedFingerprint === localManifest.dataFingerprint
        ? 'the approved KoLmafia data fingerprint is unchanged'
        : 'KoLmafia data changed';
  } catch {
    reason = 'the published fingerprint could not be confirmed';
  }
}

const shouldDeploy = shouldDeployPages(
  process.env.GITHUB_EVENT_NAME,
  localManifest.dataFingerprint,
  publishedFingerprint,
);
const output = process.env.GITHUB_OUTPUT;
if (output) await appendFile(output, `should_deploy=${shouldDeploy}\n`);
console.log(`${shouldDeploy ? 'Deploying' : 'Skipping deployment'}: ${reason}.`);
