# Architecture

## Browser application

React and Vite build the TCRS viewer for the `/kol-tools/tcrs/` GitHub Pages path. The browser stores only layout and filter preferences in local storage. It requests one class/sign dataset at a time from the read-only API.

## API

Express validates fixed class and moon-sign identifiers, parses checked-in KoLmafia data, and returns the existing `TCRSDataResponse` contract. Responses use compression, ETags, browser caching, request rate limiting, and a bounded six-entry LRU cache. Concurrent requests for the same combination share one parser operation.

The API has no authentication, write endpoints, database, or user content. Only the GitHub Pages origin is allowed by CORS in production.

## Data

Checked-in reference files provide a deterministic fallback. The parser can refresh a requested TCRS file from the official KoLmafia repository with a short timeout. Failed upstream requests fall back to the bundled snapshot.

## Build artifacts

- `dist/pages` contains only public GitHub Pages content.
- `dist/server/server.cjs` contains the Render API bundle.

The server bundle and source maps are never placed in the Pages directory.
