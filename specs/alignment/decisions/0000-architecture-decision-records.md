# ADR 0000: Use architecture decision records

**Date:** 2026-05-09  
**Status:** Accepted  
**Tags:** governance

## Context

The HR ERP uses multiple bounded contexts, separate databases, and Kafka boundaries. We need a lightweight, versioned log of major technical decisions.

## Decision

1. All **cross-context integration** choices, **new deployable services**, **topic/schema breaking changes**, and **shared infrastructure** (e.g. Kafka, registry) are recorded as numbered ADRs in this directory.
2. New ADRs use [`_TEMPLATE.md`](./_TEMPLATE.md) and the next sequential number (`0001-...`, `0002-...`).
3. **Module proposals** ([`docs/architecture/module-proposal-template.md`](../../../docs/architecture/module-proposal-template.md)) must reference applicable ADRs.

## Consequences

- Small overhead on each major change; better onboarding and fewer implicit assumptions.

## References

- [Architecture governance README](../../../docs/architecture/README.md)
