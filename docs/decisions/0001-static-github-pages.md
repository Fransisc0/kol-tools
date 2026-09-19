# ADR 0001: Static GitHub Pages deployment

## Decision

Ship the viewer as a completely static GitHub Pages application.

## Rationale

The source datasets are public and read-only, so a server adds cost, availability risk, logging exposure, and operational complexity without protecting private state. Static hosting keeps deployment reproducible and free while allowing the full implementation to remain inspectable.

## Consequences

Visitors download and process only the selected dataset. Server endpoints and runtime cross-origin refreshes are intentionally unsupported. A validated scheduled Pages build refreshes production data while the checked-in snapshot remains the reviewed regression baseline; see ADR 0004.
