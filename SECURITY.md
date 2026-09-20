# Security Policy

## Supported version

Only the latest deployment from the `main` branch is supported.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature for this repository. Do not publish a suspected vulnerability before it has been reviewed. Include the affected component, reproduction steps, likely impact, and suggested mitigation; do not include real credentials or personal information.

## Security model

KoL Tools is a same-origin static application with no backend, accounts, write endpoints, database, payment flow, telemetry, runtime secrets, or user-submitted content. Browser preferences remain in local storage. Class and sign identifiers are checked against fixed allowlists before any asset URL is formed, and worker errors are sanitized.

Data of Loathing and KoLmafia inputs are untrusted build inputs. The deployment workflow never executes upstream code. It reads a bounded SQLite snapshot and 21 allowlisted KoLmafia files, rejects malformed and oversized sources, and blocks changes to reviewed TCRS derivation/RNG code until parity is checked. Every class/sign combination must parse successfully before a new Pages artifact can replace the last working deployment.

HTML entry points use restrictive content-security and referrer policies. Release checks enforce immutable GitHub Action revisions, dependency auditing, CodeQL, secret scanning, exact data inventories, no source maps, and history-aware privacy scanning.
