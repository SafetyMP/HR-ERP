# GitHub presentation playbook

Audience: **maintainers**. This page captures the repository's GitHub "storefront" — the About panel, README trust signals, the demo image, and the community-health surface — plus how to keep them fresh. None of this changes the merge bar; it is presentation only.

## Repository About panel (GitHub UI)

Set in **Settings** or the gear icon next to About on the repo home. Keep it to a single sentence so it reads well in search results and the sidebar:

> Evergreen OSS reference for multi-tenant HR SaaS + in-repo agent governance harness. Runnable Next.js + Postgres demo — not a certified payroll vendor.

- **Website:** the live preview URL (currently the Vercel `main` deployment).
- **Topics:** confirm the set stays aligned with the niche — `hr`, `payroll`, `multi-tenant`, `saas`, `reference-architecture`, `agent-governance`, `cursor`, `nextjs`, `prisma`, `open-source`.

## README badges

The badge row lives near the top of [`README.md`](../../README.md):

- **License** and **Node.js** — static [badgen.net](https://badgen.net) badges (shields.io has been unreliable for README rendering).
- **Quality gate** — status of [`.github/workflows/quality-gate.yml`](../../.github/workflows/quality-gate.yml) (PR validation). Use `?event=pull_request` — this workflow never runs on `main`, so `?branch=main` renders as “no status”.
- **Deploy production** — status of [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) (post-merge `main` CI gate); `?branch=main` is correct here.
- **Release** — latest GitHub Release via badgen (`badgen.net/github/release/...`).
- **OpenSSF Scorecard** — workflow status from [`.github/workflows/scorecard.yml`](../../.github/workflows/scorecard.yml) (`publish_results: true`); badge links to the [scorecard.dev viewer](https://scorecard.dev/viewer/?uri=github.com/SafetyMP/HR-ERP) for the numeric score. Prefer the GitHub Actions badge over `api.scorecard.dev/.../badge` — that endpoint 302s to shields.io and often fails to render.

If a workflow file is renamed, update the matching badge URL and its link target. Badge image and link both encode the workflow filename.

## Demo image

The README hero references [`docs/assets/demo.gif`](../assets/demo.gif) — a cycling GIF (2s per frame, matching PSA `GIF_FRAME_DELAY_MS`) across employee home, paystub, time & attendance, and benefits. All frames use synthetic demo seed data (no PII, no production URLs).

### Regenerating the demo GIF

When you have Docker available:

1. `npm ci && cp .env.example .env`, then set `JWT_SECRET` in `.env`.
2. `npm run db:up && npm run demo:bootstrap && npm run dev`.
3. In another terminal: `npm run screenshots` (writes PNGs + `docs/assets/demo.gif`).

Optional: `SCREENSHOT_BASE_URL=https://your-preview.example npm run screenshots` for a hosted preview.

Re-capture when the employee shell (Feature 022) changes materially so the storefront does not drift from the product.

## Community profile

GitHub reports a community-health percentage under **Insights -> Community Standards**. The repo already reports 100 percent: README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue templates, and a PR template are all present. Issue templates are YAML forms under [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/). GitHub Discussions is intentionally not enabled; open-ended questions route through the documentation issue template (see [`.github/ISSUE_TEMPLATE/config.yml`](../../.github/ISSUE_TEMPLATE/config.yml)).

## Optional, later

- **Social preview image** — Settings -> Social preview. This is the Open Graph card shown when the repo is shared; it is separate from the README hero and can reuse a rendered version of the demo image.
- **OpenSSF Best Practices badge** — worth enrolling if the project pursues broader supply-chain assurance signals (complements the Scorecard workflow above).

Related: [github-branch-protection.md](github-branch-protection.md) for required checks and rulesets.
