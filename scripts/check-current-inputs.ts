import { appendFile, readFile } from 'node:fs/promises';

import { acquireCurrentSources, sourceFingerprint } from './data/currentSources';

const dolEtag = (await readFile('.staged-data/dol.etag', 'utf8')).trim() || undefined;
const sources = await acquireCurrentSources({
  kolmafiaRoot: '.upstream/kolmafia',
  dolDatabase: '.staged-data/dol.sqlite',
  dolEtag,
});
const fingerprint = sourceFingerprint(sources.files);
let shouldDeploy = true;

if (process.env.GITHUB_EVENT_NAME === 'schedule') {
  try {
    const response = await fetch('https://fransisc0.github.io/kol-tools/tcrs/data/manifest.json', {
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      const published = (await response.json()) as { dataFingerprint?: unknown };
      shouldDeploy = published.dataFingerprint !== fingerprint;
    }
  } catch {
    // An unavailable published manifest is not evidence that data is unchanged.
  }
}

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `should_deploy=${shouldDeploy}\n`);
}
console.log(
  `Input fingerprint ${fingerprint.slice(0, 12)}; deployment ${shouldDeploy ? 'required' : 'skipped'}.`,
);
