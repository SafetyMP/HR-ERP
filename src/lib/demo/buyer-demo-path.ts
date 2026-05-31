import type { DemoPreviewPersona } from "@/lib/auth/demo-preview-config";

/** Buyer-verifiable wins — aligned with docs/product/ess-friction-scorecard.md */
export const BUYER_VALUE_PILLARS = [
  {
    id: "w1",
    title: "One portal",
    description: "Pay, time, leave, benefits, and profile in a single employee experience.",
  },
  {
    id: "w2",
    title: "Native payroll",
    description: "Pay runs and earnings statements share the same payroll data — no CSV handoffs.",
  },
  {
    id: "w3",
    title: "Ownable policy",
    description: "Deterministic pay math with versioned rules and partner export when you need filing.",
  },
  {
    id: "w4",
    title: "Enforceable tenancy",
    description: "JWT, ABAC, and Postgres RLS — isolation is enforced, not configuration theater.",
  },
  {
    id: "w5",
    title: "Hiring in-app",
    description: "Requisitions through offer without a separate ATS login for hiring managers.",
  },
] as const;

export type BuyerDemoStep = {
  order: number;
  href: string;
  title: string;
  narrative: string;
  personas: DemoPreviewPersona[];
};

/** ≤30 minute buyer script — no Track D or mock routes. */
export const BUYER_DEMO_STEPS: BuyerDemoStep[] = [
  {
    order: 1,
    href: "/employee",
    title: "Employee home",
    narrative: "One portal for pay, time, leave, and benefits.",
    personas: ["employee"],
  },
  {
    order: 2,
    href: "/employee/paystub",
    title: "Current earnings statement",
    narrative: "Pay from the same system that runs payroll.",
    personas: ["employee"],
  },
  {
    order: 3,
    href: "/employee/time",
    title: "Time & PTO",
    narrative: "Clock status, balances, and recorded time off.",
    personas: ["employee"],
  },
  {
    order: 4,
    href: "/employee/benefits",
    title: "Benefits enrollments",
    narrative: "Active plans and election change intent without leaving the portal.",
    personas: ["employee"],
  },
  {
    order: 5,
    href: "/hr/dashboard",
    title: "HR operations dashboard",
    narrative: "Headcount, exceptions, and queues for HR admins.",
    personas: ["hr"],
  },
  {
    order: 6,
    href: "/hr/payroll-runs",
    title: "Payroll runs",
    narrative: "Native pay runs, period lock, and partner export — not a third-party payroll UI.",
    personas: ["hr"],
  },
  {
    order: 7,
    href: "/manager/recruiting",
    title: "Recruiting pipeline",
    narrative: "Hiring managers work reqs and offers without a separate ATS.",
    personas: ["manager"],
  },
];

export function demoStepsForPersona(persona: DemoPreviewPersona): BuyerDemoStep[] {
  return BUYER_DEMO_STEPS.filter((step) => step.personas.includes(persona));
}

export function nextDemoStep(
  persona: DemoPreviewPersona,
  pathname: string,
): BuyerDemoStep | null {
  const steps = demoStepsForPersona(persona);
  const normalized = pathname.split("?")[0] ?? pathname;
  const idx = steps.findIndex(
    (step) => normalized === step.href || normalized.startsWith(`${step.href}/`),
  );
  if (idx === -1) return steps[0] ?? null;
  return steps[idx + 1] ?? null;
}
