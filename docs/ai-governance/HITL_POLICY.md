# Human-in-the-loop (HITL) policy

## Principle

No AI or automated **recommendation pipeline** may **directly cause** hiring, termination, compensation changes, or formal performance discipline without **mandatory human review and documented sign-off**.

Software may **propose**, **rank**, or **surface evidence**; humans **decide** and **execute** employment actions through governed workflows.

## Prohibited autonomous actions

The following **must not** be performed or scheduled solely from model output, batch scores, or rules engines without an approved human decision record:

- **Hire** or **no-hire** (including auto-rejecting candidates at a vendor ATS boundary).
- **Termination**, **layoff selection**, or **constructive** role elimination triggered by score alone.
- **Compensation** changes: base, bonus, equity, benefits tier changes tied to model output without HR approval.
- **PIP initiation**, **formal warning** issuance, or **promotion/demotion** decisions executed without human review.
- **Automated messaging** to employees/Candidates that states or implies a **final** employment outcome when that outcome is score-driven (e.g., “you were not selected” sent without human confirmation on the individual case).

**Counsel must confirm** wording for your jurisdictions and collective bargaining contexts.

## Required workflow states

All AI-backed high-impact proposals use a **state machine** (see implementation in [`lib/governance/hitl.ts`](../../lib/governance/hitl.ts)):

1. `PROPOSED` — model output captured with explanation snapshot; no employment action executed.
2. `AWAITING_REVIEW` — in HR/manager queue (optional sub-state for dual control).
3. `APPROVED` — reviewer identity and time recorded; still **not** an employment action until execution step if split.
4. `REJECTED` — closed; audit retained.
5. `EXECUTED` — only after `APPROVED`; links to the **human-triggered** operational action (ticket, workflow ID).

Engineering **must** enforce at API/workflow layer that `EXECUTED` cannot occur unless `APPROVED` is set with a valid reviewer.

## Roles and dual control

Default pattern (tunable per tenant policy):

| Action tier | Proposer | Approver |
|-------------|----------|----------|
| Candidate screening recommendation | Manager or recruiter | HRBP or talent lead |
| PIP / discipline signal | Manager | HRBP + (counsel-defined) |
| Compensation recommendation | Manager or comp analyst | HR + Finance (policy-defined) |

**Dual control:** for tiers above “informational”, the **approver** must differ from the **proposer** where organizational policy requires it.

## Audit

Every transition **produces an append-only audit event** (`GovernanceAuditEvent` in Prisma) with correlation ID, actor, entity references, and hashed explanation linkage where applicable.

## Exceptions

There are **no** “silent” exceptions. Any emergency bypass (e.g., fraud hold) requires a **break-glass** procedure documented in Security with post-hoc review.

---

Revision: 2026-05-09
