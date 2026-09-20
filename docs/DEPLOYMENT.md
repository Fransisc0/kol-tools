# Deployment

GitHub Pages is the sole runtime host. There is no API, Render service, database, payment method, runtime secret, or browser-side upstream request.

The Pages workflow runs on `main`, daily at 06:17 UTC, and via manual dispatch. Its read-only build job checks out the approved KoLmafia inputs, downloads Data of Loathing, checks reviewed algorithm hashes and data fingerprint, runs code/dependency checks, generates and validates all 54 datasets, and uploads `dist/pages`. Only the final deployment job receives `pages: write` and `id-token: write`. On failure, the previous successful deployment remains online. Set Pages source to **GitHub Actions**.

Public URLs are `/kol-tools/` for the hub and `/kol-tools/tcrs/` for the viewer. To inspect the exact artifact locally, run `npm run build`, `npm run verify:pages`, and `npm run preview`; `npm run verify` includes these checks and privacy scanning. `npm run build:staged` accepts a sparse KoLmafia checkout at `.upstream/kolmafia` and DoL snapshot at `.staged-data/dol.sqlite` as prepared by the workflow.

Release through a protected-branch pull request. Merge only after CI, CodeQL, and secret scanning pass; then verify both public URLs, dataset switching, responsive layouts, console, and the manifest's source commit. GitHub Pages cannot supply custom response headers, so HTML uses restrictive CSP and referrer meta policies; response-header controls require a different host.
