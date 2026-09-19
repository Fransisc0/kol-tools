# Updating KoLmafia data

Production refreshes automatically each day from the official `kolmafia/kolmafia` repository. The workflow checks out only `data/TCRS` and nine explicitly named `src/data` files. It records the exact upstream commit, rejects invalid inputs, verifies deterministic output, parses all 54 combinations, and retains the previous deployment if any check fails.

The checked-in files under `data/kolmafia` are the deterministic development, regression, and emergency-fallback snapshot. To update that snapshot intentionally:

1. Check out a reviewed KoLmafia commit and use `npm run data:sync` to create a normalized staging directory.
2. Review the staged diff and copy only the approved normalized files into `data/kolmafia`.
3. Run `npm run verify:data`. If behavior intentionally changed, review representative response diffs before regenerating golden hashes; never update hashes merely to silence a failure.
4. Run `npm run verify` and include the upstream revision and user-visible impact in the pull request.

The generated `public/data` directory is ignored. A clean clone reconstructs it using `scripts/build-static-data.ts`.
