# HR ERP project skills — workspace grounding

Every agent that loads an `@hr-*` skill defined under this folder must treat **this repository clone as the source of truth**, not training data or other workspaces.

## Mandatory before asserting facts

1. **Confirm the workspace root** is the HR ERP checkout (expects `package.json`, `AGENTS.md`, `prisma/`, `specs/` at repo root—not an empty sandbox or unrelated project).

2. **Verify paths and symbols** you will cite: use **Read**, **Grep**, or codebase search. Do not assume files, exports, route trees, or contract paths exist until checked.

3. **Commands and toolchain:** skim repo-root [`package.json`](../../package.json) `scripts` (and workspaces if relevant) before telling the Human which npm/script to run. Align with CI under [`.github/workflows/`](../../.github/workflows/) when recommending checks.

4. **Next.js / App Router:** this repo’s Next.js differs from generic training patterns. Follow [`AGENTS.md`](../../AGENTS.md) (read guides under `node_modules/next/dist/docs/` when touching app/router code).

5. **Skills outside this repo:** if these skills were copied or symlinked to `~/.cursor/skills/`, **Still operate on the HR ERP workspace** that contains bounded-context layout, alignment ADRs under `specs/alignment/decisions/`, and orchestration rules in `.cursor/rules/`.

Skipping these steps when giving implementation or review guidance is an agent defect; skim the loaded skill text, **then ground claims in this tree**.
