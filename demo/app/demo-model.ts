export type DemoRole = "employee" | "hr";
export type RequestStatus = "Pending" | "Approved" | "Declined";

export type DemoRequest = {
  id: string;
  employee: string;
  dates: string;
  hours: number;
  status: RequestStatus;
};

export const DEMO_ROUTES = [
  "/employee",
  "/employee/paystub",
  "/employee/time",
  "/employee/pto",
  "/employee/benefits",
  "/employee/hr-request",
  "/hr/dashboard",
  "/hr/review-queue",
  "/hr/payroll-runs",
] as const;

export const DEMO_ROUTE_SET: ReadonlySet<string> = new Set(DEMO_ROUTES);

export function initialRequests(): DemoRequest[] {
  return [
    {
      id: "DEMO-101",
      employee: "Casey Rivera",
      dates: "Dec 7–8, 2026",
      hours: 16,
      status: "Pending",
    },
  ];
}

export const TIME_OFF_OPTIONS = [
  { dates: "Dec 14, 2026", hours: 8 },
  { dates: "Dec 21–22, 2026", hours: 16 },
] as const;

export const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/employee": "Your workday, with the next step in reach.",
  "/employee/paystub": "A clear view of your latest earnings statement.",
  "/employee/time": "See your status and manage today's shift.",
  "/employee/pto": "Plan a break and follow your request from start to finish.",
  "/employee/benefits": "Know your coverage and where to go for help.",
  "/employee/hr-request": "A clear starting point for your HR questions.",
  "/hr/dashboard": "See what needs attention and move work forward.",
  "/hr/review-queue": "Review sample requests with the context you need.",
  "/hr/payroll-runs": "See each pay run's progress in one place.",
};
