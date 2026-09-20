# ADR 0001: Static GitHub Pages deployment

## Decision

Ship the viewer as a completely static GitHub Pages application.

## Rationale

The source datasets are public and read-only, so a server adds cost, availability risk, logging exposure, and operational complexity without protecting private state. Static hosting keeps deployment reproducible and free while allowing the full implementation to remain inspectable.

## Consequences

Visitors download and process only the selected generated dataset. Server endpoints and runtime cross-origin refreshes are intentionally unsupported. A validated scheduled Pages build regenerates production data from current inputs; see ADR 0004.
