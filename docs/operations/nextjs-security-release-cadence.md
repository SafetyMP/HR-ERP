# Next.js monthly security release cadence

**Audience:** Release ops, security, agents patching dependencies  
**Related:** [vercel-managed-phase1-environment.md](./vercel-managed-phase1-environment.md) · [production-rollback-runbook.md](./production-rollback-runbook.md) · [endoflife.date/nextjs](https://endoflife.date/nextjs)

## Policy (mid-2026)

Vercel runs a **scheduled monthly Security Release Program** for Next.js: advance notice on the [Next.js blog](https://nextjs.org/blog), then patch releases for supported LTS lines. Urgent / actively exploited issues may still ship out of band.

HR ERP tracks **Next.js 16 Active LTS** (`package.json` → `dependencies.next`). Do **not** assume security backports for Next.js 14.x or earlier.

| Line | Status (as of 2026-07) | Action |
|------|------------------------|--------|
| **16.x** | Active LTS | Stay current on patched `16.2.x` minors |
| **15.x** | Maintenance LTS until 2026-10-21 | N/A — this repo is on 16 |
| **14.x and earlier** | Unsupported | Upgrade path only; no patch plan |

## Operator loop (each scheduled release)

1. **Watch** the Next.js blog for the pre-announced date, severity band, and supported majors (e.g. first scheduled release **2026-07-20** targeting 16.2 and 15.5).
2. **Confirm** installed version: `npx next --version` / `package.json` pin.
3. **Upgrade** within Active LTS when the patch publishes (exact version from the advisory, not guessed).
4. **Verify** locally: `npm run typecheck`, `npm test`, `./scripts/verify.sh`.
5. **Promote** via normal git → Vercel path (Ignored Build Step + Quality gates). Staging/preview smoke first when the change is security-sensitive.
6. **Rollback** with Instant Rollback if unhealthy — [production-rollback-runbook.md](./production-rollback-runbook.md).

## 2026-07-20 checklist (first scheduled monthly release)

Announced targets: Next.js **16.2** and **15.5** (severity profile announced in advance; CVE detail at publish).

**Pre-positioned (2026-07-18):** repo pin is `next@16.2.10` (latest npm 16.2.x before the scheduled advisory). Re-run this checklist when the July 20 blog post publishes patched version numbers — do not invent versions.

- [x] Pre-patch: bump to latest Active LTS minor (`16.2.10`) and typecheck/unit recruiting suite green
- [ ] Advisory / blog post published with patched version numbers
- [ ] Bump `next` to the published **16.2.x** security patch
- [ ] `npm ci` / lockfile updated with npm 10 (not npm 11)
- [ ] `./scripts/verify.sh` green
- [ ] Preview deploy smoke OK
- [ ] Production promote + post-deploy smoke

If the advisory has not shipped yet, keep `16.2.10` (or newer non-security patch if published) and re-check on the release day.

## References

- Next.js Security Release Program announcement (July 2026)
- [production-rollback-runbook.md](./production-rollback-runbook.md) — Instant Rollback
- [AGENTS.md](../../AGENTS.md) — Definition of Done / Node 22 + npm 10
