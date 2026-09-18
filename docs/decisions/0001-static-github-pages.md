# ADR 0001: Static GitHub Pages deployment

## Decision

Ship the viewer as a completely static GitHub Pages application.

## Rationale

The source datasets are public and read-only, so a server adds cost, availability risk, logging exposure, and operational complexity without protecting private state. Static hosting keeps deployment reproducible and free while allowing the full implementation to remain inspectable.

## Consequences

Visitors download and process only the selected dataset. Server endpoints and runtime upstream refreshes are intentionally unsupported; data updates happen through reviewed repository changes.
