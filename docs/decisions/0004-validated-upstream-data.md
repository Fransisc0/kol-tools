# ADR 0004: Validated upstream data deployments

## Decision

Refresh the production static dataset daily from the official KoLmafia repository during the GitHub Pages workflow. Copy only a fixed data allowlist, record the exact source commit and file hashes, validate all 54 combinations, and deploy only a successful artifact.

## Rationale

Runtime cross-origin fetching would make availability, privacy, and reproducibility depend on another host for every visitor. Committing automated updates would require source-branch write permissions and conflict with protected-branch review. Build-time synchronization keeps runtime same-origin, requires no secrets, and lets a failed upstream change preserve the last working site.

## Consequences

Production data is normally current within one day. The repository snapshot remains the stable regression fixture rather than the production freshness mechanism. The public manifest makes every deployment reproducible from the application commit and recorded KoLmafia revision.
