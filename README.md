# KoL Tools

An open-source, privacy-conscious collection of utilities built from public KoLmafia data. The first tool is a compact browser for Two Crazy Random Summer item transformations.

- Hub: `https://fransisc0.github.io/kol-tools/`
- TCRS viewer: `https://fransisc0.github.io/kol-tools/tcrs/`

## Features

- Compare all 54 class and moon-sign combinations.
- Browse turn generation, unified buffs, NPC stores, zones, or all items.
- Search, sort, filter, paginate, and switch between compact rows and cards.
- Load only the selected dataset and parse it off the main thread.
- Refresh production data daily from the official KoLmafia repository after validating all 54 combinations.
- No backend, accounts, analytics, ads, tracking, cookies, or paid infrastructure.

## Development

Requirements: Node.js 22.13 or newer and npm 10 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. `npm run dev` generates the same allowlisted static data used by production.

Useful commands:

```sh
npm test             # unit and component tests
npm run verify:data  # compare all 54 parser outputs with release hashes
npm run verify:upstream -- --source <normalized-data-directory>
npm run build        # create the exact Pages artifact in dist/pages
npm run verify       # complete release-quality validation
```

Production data updates automatically through the fail-safe Pages workflow. See [data updates](docs/DATA_UPDATES.md) before changing the checked-in fallback snapshot or golden hashes.

## Architecture and policies

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Privacy](PRIVACY.md)
- [Security](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Architecture decisions](docs/decisions/)

`TCRSDataResponse`, `TCRSItem`, category ordering, and browser preference keys are compatibility contracts.

## Attribution and license

This is an unofficial fan project and is not affiliated with Asymmetric Publications. Data is derived from KoLmafia; see [third-party notices](THIRD_PARTY_NOTICES.md). Original project code is available under the [BSD 3-Clause License](LICENSE).
