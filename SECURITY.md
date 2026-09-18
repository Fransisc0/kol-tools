# Security Policy

## Supported version

Only the latest deployment from the `main` branch is supported.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature for this repository. Do not disclose a suspected vulnerability in a public issue before it has been reviewed.

Include the affected URL or component, reproduction steps, likely impact, and any suggested mitigation. Reports should not include real credentials or personal information.

## Security model

The application is anonymous and read-only. It has no accounts, write endpoints, database, payment flow, or application-managed secrets. Browser preferences remain in local storage.

The API validates fixed identifiers, restricts browser origins and methods, limits request rates and concurrency, bounds upstream downloads, and falls back to checked-in data. Deployment workflows use least-privilege permissions, immutable action revisions, dependency auditing, CodeQL, and history-aware secret scanning.
