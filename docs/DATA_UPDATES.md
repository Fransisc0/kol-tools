# TCRS data updates

The daily Pages workflow at 06:17 UTC and manual `workflow_dispatch` download the current Data of Loathing SQLite database and sparsely check out the 21 required files from one official KoLmafia commit. The generator does not consume KoLmafia's historical pre-generated class/sign outputs. It derives current rolls with the reviewed TCRS algorithm, exact PHP-compatible RNG, ordered pools, and special cases.

`npm run data:check` compares a SHA-256 fingerprint of every approved input with the published manifest. An unchanged scheduled run skips deployment. A changed input produces all 54 JSON datasets, validates them through the viewer parser and release checks, and deploys only if the build succeeds. If a reviewed KoLmafia algorithm/RNG file changes, generation stops for a human parity review. A failure leaves the previous Pages deployment live.

For local regeneration, use Node.js 22.13+ and npm 10+:

```sh
npm ci
npm run generate:tcrs
npm run verify:data
npm run verify
```

`npm run generate:tcrs` fetches current inputs when no local paths are supplied. For a reproducible pinned build, pass `--kolmafia-root <checkout> --dol-database <dol.sqlite> --dol-etag <etag>` to the command. The manifest records the precise KoLmafia commit/date, DoL revision/ETag, input hashes, algorithm hash, generation time, and output hashes. The JSON is disposable: delete ignored `public/data` and rebuild it from the same inputs.

New items, effects, classifications, and pool changes ordinarily need no code change. A change to KoL's actual TCRS rules or KoLmafia's derivation implementation does require reviewing and updating the local derivation, then comparing representative and full results with KoLmafia before deployment.
