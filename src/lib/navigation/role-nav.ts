export type AppRole = "employee" | "manager" | "hr";

export type NavItem = {
  href: string;
  label: string;
  /** Match prefix for active state (defaults to href) */
  matchPrefix?: string;
};

export const EMPLOYEE_NAV: NavItem[] = [
  { href: "/employee/paystub", label: "Paystub" },
  { href: "/employee/paystub/history", label: "Pay history" },
  { href: "/employee/time", label: "Time & attendance" },
  { href: "/employee/pto", label: "PTO" },
  { href: "/employee/benefits", label: "Benefits" },
  { href: "/employee/benefits/life-events", label: "Life events" },
  { href: "/employee/profile", label: "Profile" },
  { href: "/employee/performance/goals", label: "Performance goals" },
  { href: "/employee/performance/reviews", label: "Performance review" },
  { href: "/employee/learning", label: "Learning" },
  { href: "/employee/tax-documents", label: "Tax documents" },
  { href: "/employee/onboarding", label: "Onboarding" },
  { href: "/employee/leaving", label: "Leaving" },
];

export const MANAGER_NAV: NavItem[] = [
  { href: "/manager/team-attendance", label: "Team attendance" },
  { href: "/manager/team-leave", label: "Team leave" },
  { href: "/manager/punch-corrections", label: "Punch corrections" },
  { href: "/manager/recruiting", label: "Recruiting", matchPrefix: "/manager/recruiting" },
  { href: "/manager/team-performance", label: "Team performance" },
];

export const HR_NAV: NavItem[] = [
  { href: "/hr/dashboard", label: "Dashboard" },
  { href: "/hr/payroll-runs", label: "Pay runs", matchPrefix: "/hr/payroll-runs" },
  { href: "/hr/benefits/life-events", label: "Life events" },
  { href: "/hr/review-queue", label: "Review queue" },
  { href: "/hr/onboarding-templates", label: "Onboarding templates" },
];

export function navForRole(role: AppRole): NavItem[] {
  switch (role) {
    case "employee":
      return EMPLOYEE_NAV;
    case "manager":
      return MANAGER_NAV;
    case "hr":
      return HR_NAV;
  }
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "employee":
      return "Employee";
    case "manager":
      return "Manager";
    case "hr":
      return "HR operations";
  }
}
