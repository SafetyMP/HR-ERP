#!/usr/bin/env node
/**
 * Static verification for reference customer exit runbook (P1).
 * Confirms documented routes, APIs, and artifacts exist in-repo.
 */
import { accessSync, constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const checks = [
  { label: "Employee paystub", path: "src/app/employee/paystub/page.tsx" },
  { label: "Employee time", path: "src/app/employee/time/page.tsx" },
  { label: "Employee PTO", path: "src/app/employee/pto/page.tsx" },
  { label: "Employee profile", path: "src/app/employee/profile/page.tsx" },
  { label: "Employee benefits", path: "src/app/employee/benefits/page.tsx" },
  { label: "Employee life events", path: "src/app/employee/benefits/life-events/page.tsx" },
  { label: "Employee learning", path: "src/app/employee/learning/page.tsx" },
  { label: "Manager recruiting", path: "src/app/manager/recruiting/page.tsx" },
  { label: "HR payroll runs", path: "src/app/hr/payroll-runs/page.tsx" },
  { label: "HR pay period detail", path: "src/app/hr/payroll-runs/[periodId]/page.tsx" },
  { label: "Payroll lock API", path: "src/app/api/v1/payroll/runs/[periodId]/lock/route.ts" },
  { label: "Filing artifact API", path: "src/app/api/v1/payroll/runs/[periodId]/filing-artifact/route.ts" },
  { label: "Partner export API", path: "src/app/api/v1/payroll/runs/[periodId]/partner-export/route.ts" },
  { label: "HR life events API", path: "src/app/api/v1/hr/benefits/life-events/route.ts" },
  { label: "SCIM Users API", path: "src/app/api/scim/v2/Users/route.ts" },
  { label: "Integration instances API", path: "src/app/api/v1/integrations/instances/route.ts" },
  { label: "Webhook subscriptions API", path: "src/app/api/v1/integrations/webhooks/subscriptions/route.ts" },
  { label: "Payroll filing service", path: "lib/payroll/payroll-filing-service.ts" },
  { label: "Reference exit runbook", path: "docs/product/reference-customer-exit-runbook.md" },
  { label: "Reference exit appendix template", path: "docs/product/reference-customer-exit-appendix-template.md" },
  { label: "ESS friction scorecard", path: "docs/product/ess-friction-scorecard.md" },
  { label: "Election change page", path: "src/app/employee/benefits/election-change/page.tsx" },
  { label: "Election change API", path: "src/app/api/v1/me/benefits/election-change-requests/route.ts" },
  { label: "HR election change queue", path: "src/app/hr/benefits/election-change-requests/page.tsx" },
  { label: "HR election change API", path: "src/app/api/v1/hr/benefits/election-change-requests/route.ts" },
  { label: "ESS prefetch module", path: "src/lib/ess/prefetch-me-reads.ts" },
  { label: "ESS query hydrator", path: "src/components/ess/me-query-hydrator.tsx" },
  { label: "ESS friction e2e", path: "tests/e2e/ess-friction-budgets.spec.ts" },
  { label: "ESS election change friction e2e", path: "tests/e2e/benefits-election-change-friction.spec.ts" },
  { label: "ESS design token check", path: "scripts/check-ess-design-tokens.mjs" },
  { label: "Route timing (ESS)", path: "lib/api/v1/route-timing.ts" },
  { label: "Employee app shell layout", path: "src/app/employee/layout.tsx" },
  { label: "Track D production guard", path: "lib/api/v1/track-d-guard.ts" },
  { label: "Counsel track W3/W7", path: "docs/product/counsel-track-w3-w7.md" },
  { label: "Brief 026 election intent", path: "docs/product/feature-briefs/026-benefits-election-change-intent.md" },
  { label: "Brief 026 completion audit", path: "docs/product/completion-audits/features-026.md" },
  { label: "Brief 027 COBRA PDF", path: "docs/product/feature-briefs/027-cobra-notice-pdf.md" },
  { label: "Brief 028 completion audit", path: "docs/product/completion-audits/features-028.md" },
  { label: "Brief 027 completion audit", path: "docs/product/completion-audits/features-027.md" },
  { label: "Partner filing UX e2e", path: "tests/e2e/partner-filing-feature-028.spec.ts" },
  { label: "Reference exit pilot checklist", path: "docs/product/reference-customer-exit-pilot-checklist.md" },
  { label: "Track D PO decision", path: "docs/product/track-d-po-decision.md" },
  { label: "ESS load test script", path: "scripts/load-test-ess-reads.mjs" },
  { label: "lib module boundaries doc", path: "docs/architecture/lib-module-boundaries.md" },
  { label: "Production checklist", path: "docs/operations/phase1-production-checklist.md" },
];

let failed = 0;
for (const check of checks) {
  const full = join(ROOT, check.path);
  try {
    accessSync(full, constants.R_OK);
    console.log(`OK  ${check.label}`);
  } catch {
    console.error(`MISS ${check.label} — ${check.path}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} reference exit check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} reference customer exit artifacts verified.`);
