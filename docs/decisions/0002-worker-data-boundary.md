# ADR 0002: Parse datasets in a Web Worker

## Decision

Generate reference data and class/sign JSON at build time, fetch only the selected dataset, and parse it in a dedicated Web Worker.

## Rationale

Parsing can be CPU intensive and must not block navigation or filter interaction. A typed message boundary isolates that work while preserving the established domain response contract.

## Consequences

Worker messages carry request IDs and sanitized failures. Asset identifiers are validated before URL construction, and build scripts own access to the complete source-data tree.
