# HR ERP QA chaos — extended reference

## Synthetic fixture concerns (factory overlays)

| Domain | Compose in scenarios |
| --- | --- |
| Payroll tax | Worksite vs residence, reciprocal certs, remote sourcing |
| Leave | FMLA tenure/hours, intermittent vs continuous, STD/LTD overlap, RTW |
| Equity / comp | Grant vs vest vs termination, retro grants vs closed payroll periods |
| Benefits | QLE timing, blackout, ACA stability |

## Temporal hazards → how to reproduce

| Hazard | Approach |
| --- | --- |
| Same-instant duplicates | Freeze `FakeClock` at `T`; `parallelDuplicateBarrier` / `Promise.all` on writes |
| DST / TZ edges | Zone-aware tests (`America/New_York`); replace UTC stubs before payroll cert |
| Out-of-order events | Replay webhooks / duplicate payloads with identical idempotency keys |
| Lost updates | Optimistic versioning + assert conflict paths |

## CI / attribution

- Shard Vitest with `--shard=i/n`; log **`VITEST_SEED`** (e.g. `GITHUB_RUN_ID`) in every failing job’s `REPRO` line.  
- Integration: real Postgres + `prisma migrate deploy` before DB suites.

## FAILURE_SUMMARY (canonical)

```
FAILURE_SUMMARY: One sentence invariant violated.

REPRO: Commands / test filter / seed value.

INPUT_ARTIFACTS: Scenario IDs + minimal JSON (or hash of mega-batch seed).

EXPECTED: Exact predicate or snapshot fragment.

OBSERVED: Response body / DB row / log excerpt.

STACK_HOT_PATH: Top frames linking domain → adapter → persistence.

ROOT_CAUSE_HYPOTHESIS: Ordering bug vs missing constraint vs wrong TZ vs stale read.

BLAST_RADIUS: Modules/endpoints affected.

FIX_OWNER_HINT: Which subsystem/agent owns rewrite.

NEXT_ARTIFACTS_REQUESTED: e.g., migration adding UNIQUE (employee_id, date); reconciliation job spec.
```
