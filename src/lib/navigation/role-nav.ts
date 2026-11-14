export type AppRole = "employee" | "manager" | "hr";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
  keywords?: string[];
};

export type NavGroup = { label: string; items: NavItem[] };

const EMPLOYEE_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/employee",
        label: "Home",
        description: "Your day, at a glance",
      },
    ],
  },
  {
    label: "Pay & time",
    items: [
      {
        href: "/employee/paystub",
        label: "Pay statement",
        description: "View your latest earnings",
        keywords: ["paystub", "salary", "earnings"],
      },
      {
        href: "/employee/paystub/history",
        label: "Pay history",
        description: "Find a previous statement",
        keywords: ["payslip", "past earnings"],
      },
      {
        href: "/employee/tax-documents",
        label: "Tax documents",
        description: "View your tax forms",
        keywords: ["w2", "w-2"],
      },
      {
        href: "/employee/time",
        label: "Time & attendance",
        description: "Clock in, clock out, and review time",
        keywords: ["timesheet", "punch", "hours"],
      },
      {
        href: "/employee/pto",
        label: "Time off",
        description: "Check your balance and request leave",
        keywords: ["pto", "vacation", "holiday", "absence"],
      },
    ],
  },
  {
    label: "Benefits",
    items: [
      {
        href: "/employee/benefits",
        label: "My benefits",
        description: "Review your enrolled plans",
        keywords: ["insurance", "coverage"],
      },
      {
        href: "/employee/benefits/election-change",
        label: "Change benefits",
        description: "Request an enrollment change",
        keywords: ["election", "enroll", "insurance"],
      },
      {
        href: "/employee/benefits/life-events",
        label: "Life events",
        description: "Report a qualifying life event",
        keywords: ["marriage", "birth", "dependent"],
      },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        href: "/employee/performance/goals",
        label: "Goals",
        keywords: ["performance", "objectives"],
      },
      {
        href: "/employee/performance/reviews",
        label: "Performance reviews",
        keywords: ["feedback", "appraisal"],
      },
      {
        href: "/employee/learning",
        label: "Learning",
        keywords: ["training", "courses"],
      },
    ],
  },
  {
    label: "Profile & support",
    items: [
      {
        href: "/employee/profile",
        label: "My profile",
        description: "Personal details and emergency contacts",
        keywords: ["address", "phone", "contact"],
      },
      {
        href: "/employee/organization",
        label: "My organization",
        keywords: ["team", "manager", "department"],
      },
      {
        href: "/employee/hr-request",
        label: "Contact HR",
        description: "Ask a question or request help",
        keywords: ["support", "help", "case", "request"],
      },
      {
        href: "/employee/onboarding",
        label: "Onboarding",
        keywords: ["new hire", "getting started"],
      },
      {
        href: "/employee/leaving",
        label: "Leaving",
        keywords: ["offboarding", "exit"],
      },
    ],
  },
];

const MANAGER_GROUPS: NavGroup[] = [
  {
    label: "Team & time",
    items: [
      { href: "/manager/team-attendance", label: "Team attendance" },
      {
        href: "/manager/team-leave",
        label: "Team leave",
        keywords: ["pto", "time off"],
      },
      {
        href: "/manager/punch-corrections",
        label: "Punch corrections",
        keywords: ["timesheet", "clock"],
      },
    ],
  },
  {
    label: "Hiring & growth",
    items: [
      {
        href: "/manager/recruiting",
        label: "Recruiting",
        keywords: ["hiring", "applicants", "offers"],
      },
      {
        href: "/manager/team-performance",
        label: "Team performance",
        keywords: ["reviews", "goals"],
      },
    ],
  },
];

const HR_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/hr/dashboard",
        label: "HR overview",
        description: "Priorities across people operations",
      },
    ],
  },
  {
    label: "Daily operations",
    items: [
      {
        href: "/hr/review-queue",
        label: "Requests & corrections",
        description: "Review employee cases and corrections",
        keywords: ["review queue", "approvals", "inbox"],
      },
      {
        href: "/hr/payroll-runs",
        label: "Payroll runs",
        description: "Review pay periods and exceptions",
        keywords: ["pay runs", "payroll", "close", "export"],
      },
    ],
  },
  {
    label: "Benefits administration",
    items: [
      {
        href: "/hr/benefits/life-events",
        label: "Life events",
        description: "Review qualifying life events",
        keywords: ["insurance", "dependent"],
      },
      {
        href: "/hr/benefits/election-change-requests",
        label: "Benefit change requests",
        description: "Review requested enrollment changes",
        keywords: ["election intents", "insurance", "enrollment"],
      },
    ],
  },
  {
    label: "Employee lifecycle",
    items: [
      {
        href: "/hr/onboarding-templates",
        label: "Onboarding templates",
        description: "Prepare the new-hire experience",
        keywords: ["new hire", "checklist"],
      },
    ],
  },
];

const GROUPS: Record<AppRole, NavGroup[]> = {
  employee: EMPLOYEE_GROUPS,
  manager: MANAGER_GROUPS,
  hr: HR_GROUPS,
};

export const EMPLOYEE_NAV = EMPLOYEE_GROUPS.flatMap((group) => group.items);
export const MANAGER_NAV = MANAGER_GROUPS.flatMap((group) => group.items);
export const HR_NAV = HR_GROUPS.flatMap((group) => group.items);
const ITEMS: Record<AppRole, NavItem[]> = {
  employee: EMPLOYEE_NAV,
  manager: MANAGER_NAV,
  hr: HR_NAV,
};

export function navGroupsForRole(role: AppRole): NavGroup[] {
  return GROUPS[role];
}

export function navForRole(role: AppRole): NavItem[] {
  return ITEMS[role];
}

/** Longest segment-boundary match keeps exactly one parent active on detail pages. */
export function activeNavItem(
  role: AppRole,
  pathname: string,
): NavItem | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  return navForRole(role)
    .filter(
      (item) =>
        path === item.href ||
        (item.href !== "/employee" && path.startsWith(`${item.href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function searchNavigation(role: AppRole, query: string): NavGroup[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return navGroupsForRole(role)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const text = [
          group.label,
          item.label,
          item.description,
          ...(item.keywords ?? []),
        ]
          .join(" ")
          .toLocaleLowerCase();
        return terms.every((term) => text.includes(term));
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function roleLabel(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    employee: "Employee",
    manager: "Manager",
    hr: "HR operations",
  };
  return labels[role];
}
