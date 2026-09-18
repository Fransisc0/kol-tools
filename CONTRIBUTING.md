# Contributing

## Development workflow

1. Create a focused branch from `main`.
2. Install exact dependencies with `npm ci`.
3. Make the smallest cohesive change and add tests for changed behavior.
4. Run `npm run verify` before opening a pull request.
5. Explain the user-facing impact and compatibility considerations in the pull request.

Do not commit environment files, logs, generated build output, personal information, secrets, or data copied from private sources.

## Code style

- Prefer typed, pure helpers for data semantics and filtering.
- Keep React components focused on rendering and interaction.
- Preserve the public API response shape and existing local-storage keys unless a migration is explicitly documented.
- Maintain keyboard operation, visible focus states, sufficient contrast, and responsive behavior.
