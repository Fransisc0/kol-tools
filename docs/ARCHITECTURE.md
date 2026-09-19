# Architecture

## Runtime

The application is a static React/Vite site under `/kol-tools/tcrs/`. GitHub Pages serves HTML, JavaScript, styles, a deterministic reference index, and an explicit allowlist of TCRS text files. There is no application server.

For each selection, the browser loads the shared reference index once and the selected base, café-food, and café-booze files. A dedicated Web Worker parses those files so the React main thread stays responsive. Identical requests share one in-flight operation; completed results use a two-entry least-recently-used cache. Request IDs let the React client ignore stale responses after rapid selection changes.

## Source boundaries

- `src/app` composes application-level behavior and error boundaries.
- `src/components` contains focused presentation and interaction controls.
- `src/features/tcrs/data` validates selections and loads same-origin static assets.
- `src/features/tcrs/domain` normalizes, enriches, categorizes, and finalizes parsed records.
- `src/features/tcrs/worker` owns the typed worker protocol and bounded runtime cache.
- `src/shared` and existing typed utilities hold storage and cross-feature primitives.
- `scripts/data` converts checked-in KoLmafia sources into the public reference index.

The build-time generator is the only code allowed to inspect the complete normalized source-data tree. Local development uses the checked-in snapshot. Production checks out only the approved files from `kolmafia/kolmafia`, normalizes them into an ignored staging directory, validates them as untrusted text, and generates the same static artifact shape. Upstream code is never executed.

## Public artifact

`dist/pages` is the deployable GitHub Pages artifact. It contains the hub, viewer, static assets, reference index, a sanitized source manifest, and exactly 162 allowlisted TCRS files. Source maps, environment files, logs, local paths, upstream checkout contents, backend code, and server bundles are forbidden by artifact verification.

## Compatibility

Parser output remains equivalent to the pre-static release. `scripts/fixtures/tcrs-golden-hashes.json` records a SHA-256 hash of each of the 54 serialized responses. `npm run verify:data` rebuilds each response from public static inputs and compares it with those hashes.

Dynamic upstream content cannot match fixed golden hashes by definition. The deployment workflow therefore verifies the parser against the committed golden snapshot first, then independently checks deterministic generation, structural invariants, source identity, file hashes, and successful parsing for all 54 staged upstream combinations.
