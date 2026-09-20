# Architecture

The React/Vite viewer is a static site at `/kol-tools/tcrs/`; GitHub Pages is the only runtime host. The browser fetches one shared reference index and one generated JSON dataset for the selected class/sign. A Web Worker parses and categorizes it, deduplicates in-flight requests, and retains the two most recent responses. Request IDs prevent stale selection results from replacing newer ones.

## Generation boundary

`scripts/data/currentSources.ts` obtains a bounded Data of Loathing SQLite snapshot and 21 explicitly allowlisted KoLmafia files at a single commit. It validates source sizes, encoding, symlinks, revision metadata, and the hashes of the reviewed derivation/RNG source files. No upstream code is executed. `scripts/data/dataOfLoathing.ts` reads current structured items/effects. Other `scripts/data` adapters read ordered roll tables, modifier names, special-case IDs, and reference enrichments unavailable in DoL.

Pure RNG and derivation live in `src/features/tcrs/domain/phpRandom.ts`, `rollTables.ts`, `derivationRolls.ts`, and `derivedItem.ts`. `scripts/generate-tcrs.ts` iterates all 54 combinations and writes disposable JSON records. `scripts/build-generated-static-data.ts` adds the reference index and provenance manifest. Runtime loading and worker parsing remain under `src/features/tcrs/data` and `worker`. The existing `TCRSItem`, `TCRSDataResponse`, categories, and preference keys are stable contracts.

The derivation was compared against the reviewed KoLmafia Java implementation for all 652,212 regular item rolls and 4,212 café rolls across the 54 combinations. A changed derivation source hash blocks automatic deployment for review; ordinary item/effect/pool changes are processed from current inputs.

## Artifact and trust boundary

`dist/pages` contains the hub, viewer, reference index, manifest, and exactly 54 class/sign JSON files. Raw SQLite, KoLmafia source, generated server code, source maps, environment files, and logs must not be deployed. `npm run verify:pages` and the privacy scan check this inventory. The generated files in `public/data` and `dist/pages` are ignored build artifacts; a clean clone regenerates them with `npm run generate:tcrs` or `npm run build`.
