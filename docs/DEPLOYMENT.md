# Deployment

## GitHub Pages

The Pages workflow validates the repository, builds with `VITE_API_BASE_URL`, verifies the public artifact, and uploads `dist/pages`. GitHub Pages must use **GitHub Actions** as its source.

The public layout is:

- `/kol-tools/` — tools hub
- `/kol-tools/privacy.html` — privacy statement
- `/kol-tools/tcrs/` — TCRS viewer

## Render API

`render.yaml` defines a free Node web service in the Virginia region. It builds only the server, listens on Render's `PORT`, and exposes `/api/health` for health checks.

Production environment values:

- `NODE_ENV=production`
- `ALLOWED_ORIGIN=https://fransisc0.github.io`
- `SERVE_CLIENT=false`

The free service can sleep after inactivity. The client explains this when an initial request takes longer than eight seconds.

## Release procedure

1. Run `npm run verify` locally.
2. Merge through a passing pull request.
3. Confirm the Render deployment and public health endpoint.
4. Confirm the Pages deployment at the hub and viewer URLs.
5. Perform responsive and browser-console acceptance checks.
6. Tag the verified commit using semantic versioning.
