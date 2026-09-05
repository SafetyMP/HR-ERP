# Copilot / community agents

This repository is an **HR scaffold for testing agent governance** on a multi-tenant SaaS fixture. Do not move the community contract out of `AGENTS.md`. Factory/site overlay lives in `docs/factory-overlay.md`.

## Verify

- `./scripts/harness/verify.sh` — Definition of Done
- `./scripts/verify.sh` — optional human wrapper
- `npm run governance:lint` / `governance:ci` — tier + merge gates
- `./scripts/adversarial.sh` — authorized probes only

Do not claim green from prose.

## Never

- Never treat this tree as a certified payroll vendor or production HRIS.
- Never commit real employee, tax, or payroll PII. Synthetic fixtures only.
- Never duplicate Cedar, receipt ledgers, or sandbox runtimes here. Pair [FidusGate](https://github.com/SafetyMP/FidusGate) for runtime receipts.
- Never self-approve, invent a gate PASS, or edit corporate approval state.
- Never set `NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN` on Vercel Production.

Community contract: [AGENTS.md](../AGENTS.md).  
Pivot: [docs/DESIGN-PIVOT.md](../docs/DESIGN-PIVOT.md).  
High-risk fixture DDL: [.github/skills/hr-data-custody/SKILL.md](skills/hr-data-custody/SKILL.md).
