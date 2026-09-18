# Architecture

## Browser application

React and Vite build the TCRS viewer for the `/kol-tools/tcrs/` GitHub Pages path. The browser stores only layout and filter preferences in local storage. It requests one class/sign dataset at a time from the read-only API.

## API

Express validates fixed class and moon-sign identifiers, parses checked-in KoLmafia data, and returns the existing `TCRSDataResponse` contract. Responses use compression, ETags, browser caching, request rate limiting, and a bounded six-entry LRU cache. Concurrent requests for the same combination share one parser operation.

Resource controls operate at two layers: at most eight dataset responses may be active at once, and at most two uncached parser jobs may run concurrently. Upstream files have a four-second timeout and a 2 MiB streaming limit.

The API has no authentication, write endpoints, database, or user content. Only the GitHub Pages origin is allowed by CORS in production.

## Data

Checked-in reference files provide a deterministic fallback. The parser can refresh a requested TCRS file from the official KoLmafia repository with a short timeout. Failed upstream requests fall back to the bundled snapshot.

Parser responsibilities are separated across reference-data loading, item/source enrichment, normalization, response finalization, source retrieval, zone enrichment, caching, and concurrency modules. The parser orchestrator retains the ordered categorization rules so their precedence remains visible while preserving the established response schema.

## Client organization

Shared semantics and filtering remain pure and independently tested. Item-list state, desktop filter controls, quality controls, preference persistence, and item-type presentation configuration are separate from the rendering orchestrators. Browser and server code use separate strict TypeScript and ESLint environments.

## Build artifacts

- `dist/pages` contains only public GitHub Pages content.
- `dist/server/server.cjs` contains the Render API bundle.

The server bundle and source maps are never placed in the Pages directory.
