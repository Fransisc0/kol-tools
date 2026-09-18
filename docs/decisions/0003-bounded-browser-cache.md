# ADR 0003: Bounded browser caching

## Decision

Deduplicate identical in-flight requests and retain only the two most recently used parsed responses in memory.

## Rationale

Parsed responses are substantially larger than their compressed inputs. A two-entry LRU makes common back-and-forth switching fast without allowing memory use to grow across all 54 combinations.

## Consequences

Older selections are reloaded from ordinary browser HTTP cache and parsed again. The application stores no dataset response in local storage.
