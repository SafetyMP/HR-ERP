# Site contract (factory overlay)

Corporate/site harness overlay for site id `hr-erp`. Community and Copilot agents should start at [AGENTS.md](../AGENTS.md). This page is the factory voice that used to live at the root of that file.

## Gates

| Command | Purpose |
|---|---|
| `./scripts/verify.sh` | Functional and static acceptance |
| `./scripts/adversarial.sh` | Authorized local adversarial probes |

Record `verification_scripts` as site-relative `scripts/harness` (exactly `verify.sh` and `adversarial.sh`). Optional wrappers may remain at `scripts/verify.sh` / `scripts/adversarial.sh` for humans; they are outside the digest boundary.

The corporate handoff fixes scope. The site manager assigns ADRs; site specialists write;
the root orchestrator dispatches nondelegating workers and runs gate commands; operations
excellence reviews immutable root-produced evidence. Work in isolated roots, never edit
corporate approval state, and never self-approve. A site role cannot return work to
corporate design; that boundary requires an explicit user rework authorization.

Site id: `hr-erp`. Prior Cursor Harness v4 is under `_archives/harness-v4/`.

## Definition of Done

Before pushing a feature branch or opening a PR:

```bash
./scripts/verify.sh
```

This mirrors the `ci / web` job (lint, governance, build, unit tests). CI uses **Node 22 + npm 10** — `package.json` pins `packageManager: npm@10.9.2`; do not regenerate `package-lock.json` with npm 11.

Full QA parity (integration + e2e) requires Postgres and demo seed — see [docs/QA.md](./QA.md#ci-e2e-prerequisites).

Positioning for this site: [DESIGN-PIVOT.md](./DESIGN-PIVOT.md).
