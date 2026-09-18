# Deployment

GitHub Pages is the only runtime host. The project has no Render service, API, database, payment method, or runtime secrets.

## Build and publish

The Pages workflow runs `npm ci` and `npm run verify`, configures Pages, uploads `dist/pages`, and deploys it. Repository Pages settings must use **GitHub Actions** as the source.

Public layout:

- `/kol-tools/` — tools hub
- `/kol-tools/tcrs/` — TCRS viewer

To inspect the exact artifact locally:

```sh
npm run build
npm run preview
```

## Release procedure

1. Run `npm run verify` from a clean checkout.
2. Review dependency, privacy, artifact, and 54-dataset equivalence results.
3. Merge only after CI, CodeQL, and secret scanning pass.
4. Confirm the Pages deployment and both public URLs.
5. Check responsive layouts, keyboard interaction, dataset switching, and the browser console.
6. Tag the verified commit using semantic versioning.

GitHub Pages cannot add project-defined HTTP response headers. Every HTML entry point therefore includes a restrictive CSP and no-referrer policy. Controls that require response headers, such as `frame-ancestors`, would require a different host.
