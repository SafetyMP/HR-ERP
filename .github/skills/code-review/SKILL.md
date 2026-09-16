---
name: code-review
description: "Review HR-ERP PRs as a T0-T4 agent-governance scaffold, not a payroll product. Use on pull requests that touch Prisma, RLS, payroll fixtures, governance lint, or Next.js app routes. Flag real PII, Cedar duplication, and demo-signin on production."
---

# Copilot code review — HR-ERP

Use this skill when reviewing a pull request in this repository.

Treat ESS/payroll/benefits as a **fixture domain**.

- Reject real employee, tax, or payroll PII.
- Reject duplicating FidusGate Cedar/receipt runtimes.
- Reject `NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN` on Vercel Production.
- Verify with `./scripts/harness/verify.sh`.


## Always flag

- Secrets, `.env` values, private keys, or real personal data in the diff
- Weakened or skipped verify / lint / typecheck / adversarial gates
- Invented success (prose claiming a gate passed with no command output)
- Fail-open authorization, skipped human approval, or agents recording `--actor user`

## Never request

- Drive-by major upgrades, formatter churn, or unrelated refactors
- Softening honesty disclaimers or certification claims
