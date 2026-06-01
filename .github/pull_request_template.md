## Summary

<!-- 2–4 sentences -->

## Governance

- **riskTier:** <!-- T0 | T1 | T2 | T3 | T4 — ADR 0010 + function lanes ADR 0011 -->
- **delegatedTaskPlan:** <!-- output of npm run governance:plan or handoff JSON -->
- **Suggested tier (CI):** <!-- npm run governance:lint -->
- **Runtime:** cursor-3-native
- **Runtime audit:** <!-- npm run governance:audit:write — grade + critical ids from specs/features/agent-governance-alarp/audit-latest.json -->

### Collaboration (Harness HITL — T2+)

- [ ] `collaborationPlan` or `.cursor/plans/*.md` linked
- [ ] `revalidationConfirmed: true` before specialized @ skills (T3+)
- [ ] `humanDecisionRecord` complete (principal + chosenStrategy) when T3+

### Harness delta (Adaptation plane)

- New friction / ledger signal? Y/N → signal_id: ___

### PO orchestration checkpoint (required when riskTier ≥ T1; T0 use `step 1 chore N/A`)

```
Feature brief / spike ADR: 
UAC count: 
PO gate complete: Y/N
Friction targets cited: Y/N/N/A
Phase ADR: 
Payroll / Compliance / Math: N/A or brief path
```

### Golden thread stub (required when riskTier ≥ T1)

<!-- Paste table from specs/templates/golden-thread-trace-table.md -->
<!-- T3 pay/time scopes: also complete golden-thread-regulated-payroll-drill.md -->

| Risk or requirement | Control | Artifact path | Verifier | Legal (or N/A) | Compliance / kernel (or N/A) | QA / UAC # (or N/A) |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

## Module documentation

- [ ] **`README.md` updated** for any new top-level **`packages/*`**, **`services/*`**, or **`workers/*`** surface (purpose, ownership pointer, local run)—or **N/A**

## Feature / ADR links

- Feature brief / UAC: <!-- link -->
- Phase ADRs: <!-- e.g. specs/alignment/decisions/0001-phase1-scope.md -->

## Lifecycle (S&OP / value) — required when riskTier ≥ T1

- **S&OP cycle ID:** <!-- e.g. 2026-W22 or N/A for ops-only -->
- **Release train:** <!-- in-cycle | deferred -->
- **Value delivery record:** <!-- specs/templates/value-delivery-record.md path or harness N/A -->

### Evidence bundle (required when riskTier ≥ T3)

- **Evidence bundle:** <!-- specs/governance/evidence/bundles/<id>.json — npm run governance:evidence:collect -->
- **Lane sign-offs:** <!-- specs/governance/evidence/lane-signoffs/<id>.json -->

## Agent lane sign-off (parallel — ADR 0011)

Check each lane in `delegatedTaskPlan` and paste **links** (spec paths, CI jobs):

- [ ] **scout** — exploration notes or N/A
- [ ] **architect** — `specs/.../architecture-spec.md` or N/A
- [ ] **builder** — implementation complete
- [ ] **sentinel** — `security-review.md`; **no open merge blockers**
- [ ] **verifier** — `qa-plan.md` + CI / manual evidence
- [ ] **counsel** — `legal-checklist.md` (T3+ regulated paths)
- [ ] **custodian** — migration runbook (T2+ DDL)
- [ ] **release_ops** — ops/CI impact + rollback (T2+ `.github/workflows`, deploy, `docs/operations`)
- [ ] **code health** — `npm run lint` + `npm run test`; contracts drift if API changed

## Risk / rollback

<!-- known risks, feature flags, data migrations -->

### Known residual risks (governance / MCP)

<!-- If touching lib/copilot/** or hooks: link lib/copilot/governance/README.md accepted residual table; note shadow protect-mcp and stdio dev gate. -->

## FAILURE_SUMMARY

<!-- if fixing a failure, paste block from qa-plan template -->
