# Deployment

GitHub Pages is the only runtime host. The project has no Render service, API, database, payment method, or runtime secrets.

## Automatic data refresh and publish

The Pages workflow runs on pushes to `main`, manual dispatch, and daily at 06:17 UTC. It verifies the application against the committed snapshot, sparsely checks out the official KoLmafia data, copies only the 171 approved files, validates every supported dataset, and builds the Pages artifact from that staging directory. An unchanged scheduled data fingerprint skips deployment.

The build job has read-only repository access. Only the final job receives `pages: write` and `id-token: write`; it cannot modify source branches. A failed synchronization, validation, or build never replaces the last successful deployment. Repository Pages settings must use **GitHub Actions** as the source.

Public layout:

- `/kol-tools/` — tools hub
- `/kol-tools/tcrs/` — TCRS viewer

To inspect the exact artifact locally:

```sh
npm run build
npm run preview
```

To reproduce a production data build, check out the recorded KoLmafia revision, run `npm run data:sync` with its source path and commit metadata, then run `npm run verify:upstream` and `npm run build:staged`. The published manifest records the exact revision and SHA-256 inventory.

## Release procedure

1. Run `npm run verify` from a clean checkout.
2. Review dependency, privacy, artifact, and 54-dataset equivalence results.
3. Merge only after CI, CodeQL, and secret scanning pass.
4. Confirm the Pages deployment and both public URLs.
5. Check responsive layouts, keyboard interaction, dataset switching, and the browser console.
6. Verify the compact data-version link resolves to the manifest's exact KoLmafia commit.
7. Tag the verified commit using semantic versioning.

GitHub Pages cannot add project-defined HTTP response headers. Every HTML entry point therefore includes a restrictive CSP and no-referrer policy. Controls that require response headers, such as `frame-ancestors`, would require a different host.
