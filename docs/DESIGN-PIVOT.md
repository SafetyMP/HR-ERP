# Design pivot — September 2026

**Status:** Active public positioning  
**Does not delete or freeze payroll/ESS code.** Fixture surfaces stay in-tree.  
**Does not rename this repository.** A later program may consider a name that says “governance scaffold”; that is out of scope for this PR.

---

## What we compete on

The public artifact is **T0–T4 agent governance on a multi-tenant SaaS fixture**, not a mid-market HRIS.

ERPNext, Odoo, and OrangeHRM already own payroll, ESS, benefits, and people-ops feature depth. This repo does **not** try to out-feature them. Contributors should not pitch “one place for people operations for 250–5,000 employees” as the reason to clone.

What is distinctive here:

| Keep | Drop from the storefront |
| --- | --- |
| Risk tiers (T0–T4), Cursor hooks, handoffs, evidence CI | Competing on HR module checklists |
| Multi-tenant JWT / ABAC / Postgres RLS as a **realistic blast-radius fixture** | “Certified” or turnkey payroll vendor language |
| Pairing with [FidusGate](https://github.com/SafetyMP/FidusGate) for runtime receipts | Duplicating Cedar (or any second policy engine) in this tree |

## Fixture domain (why payroll stays)

ESS, payroll math (`packages/payroll-calc`), benefits, and recruiting routes remain so governance hooks have something **consequential** to protect: tenant isolation, regulated-looking writes, counsel-gated docs, and high-risk migrations.

Treat those surfaces as a **fixture domain**:

- Study them. Extend them when a governance test needs a sharper blast radius.
- Do **not** ship them as production payroll, legal HR advice, or a company HRIS.
- Do **not** delete payroll code in the name of this pivot.

## Pairing (do not duplicate Cedar)

| Repo | Role |
| --- | --- |
| **This repo** | Vertical fixture + in-repo harness (tiers, hooks, evidence, product HITL) |
| **[FidusGate](https://github.com/SafetyMP/FidusGate)** | Horizontal runtime: Cedar gates, Ed25519 receipts, MCP proxy, forensic packages |

Authoritative in-repo policy stays in git (manifest + overlay). Optional FidusGate consumption is for `authorize_tool_call`, receipts, and break-glass attestation. Thin Cursor hooks remain a backstop when a model skips the gateway. Local clone-and-run does **not** require FidusGate.

Do not grow a second Cedar engine, receipt ledger, or sandbox runtime here.

## Rename (later program)

The GitHub name `HR-ERP` still reads as an HR product. A later program may propose a rename that leads with the governance scaffold. **Do not rename the repository, packages, or Docker image in this change.**

## Related

- Evergreen copy for forks and demos: [meta/evergreen-open-source-positioning.md](./meta/evergreen-open-source-positioning.md)
- Community agent contract: [../AGENTS.md](../AGENTS.md)
- Corporate/site overlay: [factory-overlay.md](./factory-overlay.md)
