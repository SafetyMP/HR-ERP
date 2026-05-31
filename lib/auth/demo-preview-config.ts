/** Synthetic demo personas — aligned with `npm run jwt:dev:demo-*` scripts. */
export const DEMO_PREVIEW_PERSONAS = {
  employee: {
    label: "Employee",
    description: "Paystub, time, PTO, and benefits.",
    roles: ["employee"],
    subjectId: "22222222-2222-2222-2222-222222222222",
    subjectEmployeeId: "b0000001-0001-4000-8000-000000000011",
    defaultReturnTo: "/employee",
  },
  manager: {
    label: "Manager",
    description: "Team attendance, leave, and recruiting.",
    roles: ["manager"],
    subjectId: "22222222-2222-2222-2222-222222222222",
    subjectEmployeeId: "b0000001-0001-4000-8000-000000000020",
    defaultReturnTo: "/manager/team-attendance",
  },
  hr: {
    label: "HR admin",
    description: "Dashboard, payroll runs, and review queues.",
    roles: ["hr_admin"],
    subjectId: "22222222-2222-2222-2222-222222222222",
    defaultReturnTo: "/hr/dashboard",
  },
} as const;

export type DemoPreviewPersona = keyof typeof DEMO_PREVIEW_PERSONAS;

export function parseDemoPreviewPersona(raw: string | null): DemoPreviewPersona | null {
  if (raw === "employee" || raw === "manager" || raw === "hr") return raw;
  return null;
}

/** Client UI gate — set on Preview (or local) only; never on Production. */
export function demoPreviewSignInUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN === "true";
}

export function demoPreviewBootstrapHref(
  persona: DemoPreviewPersona,
  returnTo?: string,
): string {
  const landing =
    returnTo?.trim() || DEMO_PREVIEW_PERSONAS[persona].defaultReturnTo;
  const qs = new URLSearchParams({
    persona,
    returnTo: landing,
  });
  return `/api/auth/demo-preview?${qs.toString()}`;
}
