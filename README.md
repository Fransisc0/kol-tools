# KoL Tools

- Hub: `https://fransisc0.github.io/kol-tools/`
- TCRS viewer: `https://fransisc0.github.io/kol-tools/tcrs/`

## Features

- Compare all 54 class and moon-sign combinations.
- Browse turn generation, unified buffs, NPC stores, zones, or all items.
- Search, sort, filter, paginate, and switch between compact rows and cards.
- Regenerates current TCRS rolls daily from Data of Loathing and reviewed KoLmafia inputs.

## Development

Requirements: Node.js 22.13 or newer and npm 10 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The first run downloads current inputs and generates the same static data as production; it needs a network connection and can take several minutes.

Useful commands:

```sh
npm test             # unit and component tests
npm run generate:tcrs  # fetch current inputs and regenerate all 54 datasets
npm run verify:data    # parse and validate all generated datasets
npm run build        # create the exact Pages artifact in dist/pages
npm run verify       # complete release-quality validation
```

Production data updates automatically through the fail-safe Pages workflow. See [data updates](docs/DATA_UPDATES.md) for provenance and manual regeneration.

## Architecture and policies

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Privacy](PRIVACY.md)
- [Security](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Architecture decisions](docs/decisions/)

`TCRSDataResponse`, `TCRSItem`, category ordering, and browser preference keys are compatibility contracts.

## Attribution and license

This is an unofficial fan project and is not affiliated with Asymmetric Publications. Data is derived from Data of Loathing and KoLmafia; see [third-party notices](THIRD_PARTY_NOTICES.md). Original project code is available under the [BSD 3-Clause License](LICENSE).
