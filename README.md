# KoL Tools

Privacy-conscious utilities built around public KoLmafia data. The first tool is a compact browser for Two Crazy Random Summer item transformations.

- Hub: `https://fransisc0.github.io/kol-tools/`
- TCRS viewer: `https://fransisc0.github.io/kol-tools/tcrs/`
- Read-only API: `https://fransisc0-kol-tools-tcrs-api.onrender.com/`

## Features

- Compare all class and moon-sign combinations.
- Browse by turn generation, buffs, NPC stores, zones, or all items.
- Search, sort, filter, paginate, and switch between compact rows and cards.
- No accounts, analytics, advertising, tracking, or application cookies.
- Responsive and keyboard-accessible interface.

## Local development

Requirements: Node.js 22.13 or newer and npm 10 or newer.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. Development uses the same Express process for the API and Vite middleware for the client.

Copy `.env.example` to `.env.local` only when testing the separately hosted API. Environment files are ignored by Git.

## Quality checks

```sh
npm run verify
```

The verification pipeline performs TypeScript checks, ESLint, Prettier validation, Vitest, production builds, Pages artifact validation, a privacy scan, and a production dependency audit.

## Architecture and deployment

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Privacy](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

The browser preferences and `/api/tcrs` response shape are treated as compatibility contracts.

## Attribution

This is an unofficial fan project and is not affiliated with Asymmetric Publications. Data is derived from the KoLmafia project. See [third-party notices](THIRD_PARTY_NOTICES.md).

## License

Original project code is available under the [BSD 3-Clause License](LICENSE).
