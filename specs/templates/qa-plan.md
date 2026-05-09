# QA plan — <feature slug>

**UAC source:** <link to PO brief — paste UAC bullets below verbatim>

## UAC coverage map

| UAC # | Test level (unit/integration/e2e) | Automated Y/N |
| --- | --- | --- |

## Synthetic data policy

- Use **fake** employees only; forbidden: real government IDs, prod DB exports, customer spreadsheets.  
- Seed / fixture location: <path>

## Critical paths + chaos variants

- Golden path:  
- Chaotic variant (concurrency / dup submit / clock edge):  

## Accessibility smoke (employee-facing UI)

- [ ] Keyboard-only path completes primary task  
- [ ] Form fields have labels / aria where needed  
- [ ] Focus visible and logical  

## Internationalization note

- UI **locale** is separate from **employment law jurisdiction**; tests must state assumed jurisdiction.

## Evidence links

- CI run, screenshots, logs (sanitized)

## FAILURE_SUMMARY (use on any failure)

Ops workflow + CI sharding notes: [`docs/QA.md`](../../docs/QA.md).

```
FAILURE_SUMMARY: <one line>

REPRO: <commands / test filter / seed>

INPUT_ARTIFACTS: <scenario IDs / minimal JSON>

EXPECTED: <predicate>

OBSERVED: <actual>

STACK_HOT_PATH: <hot frames>

ROOT_CAUSE_HYPOTHESIS: <text>

BLAST_RADIUS: <modules / routes>

FIX_OWNER_HINT: <Architecture|Legal process|Integrations|Security|Implementation|QA|PO>

NEXT_ARTIFACTS_REQUESTED: <e.g. migration, ADR, fixture>
```
