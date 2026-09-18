# Updating KoLmafia data

1. Update only the licensed files under `data/`, preserving their upstream filenames and attribution.
2. Run `npm run prepare:data` twice and confirm `public/data/manifest.json` and `public/data/reference-data.json` are byte-identical between runs.
3. Run `npm run verify:data`. If behavior intentionally changed, review representative response diffs before regenerating golden hashes; never update hashes merely to silence a failure.
4. Run `npm run verify` and include the upstream revision and user-visible impact in the pull request.

The generated `public/data` directory is ignored. A clean clone reconstructs it using `scripts/build-static-data.ts`.
