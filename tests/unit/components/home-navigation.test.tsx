import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EmployeeHomeClient } from "@/app/employee/employee-home-client";
import { HrDashboardClient } from "@/app/hr/dashboard/hr-dashboard-client";

const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  paystub: vi.fn(),
  attendance: vi.fn(),
  pto: vi.fn(),
  benefits: vi.fn(),
  hrFetch: vi.fn(),
}));

vi.mock("@/lib/auth/use-hr-access", () => ({ useHrAccess: mocks.access }));
vi.mock("@/lib/paystub/use-current-paystub-query", () => ({
  useCurrentPaystubQuery: mocks.paystub,
}));
vi.mock("@/lib/attendance/use-today-attendance-query", () => ({
  useTodayAttendanceQuery: mocks.attendance,
}));
vi.mock("@/lib/pto/use-pto-summary-query", () => ({
  usePtoSummaryQuery: mocks.pto,
}));
vi.mock("@/lib/benefits/use-benefits-summary-query", () => ({
  useBenefitsSummaryQuery: mocks.benefits,
}));
vi.mock("@/lib/auth/hr-api-fetch", () => ({ hrApiFetch: mocks.hrFetch }));
vi.mock("@/components/auth/hr-sign-in-card", () => ({
  HrSignInCard: ({ title }: { title: string }) => <h2>Sign in: {title}</h2>,
}));

const summary = {
  headcountActive: 42,
  headcountByDepartment: [],
  openRequisitions: 3,
  medianTimeToHireDays: null,
  openPayrollExceptions: 0,
  periodsAwaitingLock: 0,
  openLifeEvents: 2,
  pendingElectionIntents: 4,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.access.mockReturnValue({
    ready: true,
    isAuthenticated: true,
    bearerToken: null,
    persistBearer: vi.fn(),
  });
  for (const query of [
    mocks.paystub,
    mocks.attendance,
    mocks.pto,
    mocks.benefits,
  ]) {
    query.mockReturnValue({ isLoading: true, isError: false, data: undefined });
  }
  mocks.hrFetch.mockImplementation(() => new Promise(() => {}));
});
afterEach(cleanup);

describe("task-first employee home", () => {
  it("keeps all common task links available while summaries load", () => {
    render(<EmployeeHomeClient />);
    const tasks = within(
      screen.getByRole("region", { name: "What would you like to do?" }),
    );
    for (const [label, href] of [
      ["Pay statement", "/employee/paystub"],
      ["Time & attendance", "/employee/time"],
      ["Time off", "/employee/pto"],
      ["My benefits", "/employee/benefits"],
      ["My profile", "/employee/profile"],
      ["Contact HR", "/employee/hr-request"],
    ]) {
      expect(
        tasks.getByRole("link", { name: new RegExp(`^${label}`) }),
      ).toHaveAttribute("href", href);
    }
    expect(screen.getAllByText("Loading…")).toHaveLength(4);
    expect(screen.queryByText("Not clocked in")).not.toBeInTheDocument();
  });

  it("does not report failed summaries as off-clock or no enrollments", () => {
    for (const query of [
      mocks.paystub,
      mocks.attendance,
      mocks.pto,
      mocks.benefits,
    ]) {
      query.mockReturnValue({
        isLoading: false,
        isError: true,
        data: undefined,
      });
    }
    render(<EmployeeHomeClient />);
    expect(screen.getAllByText("Unavailable")).toHaveLength(4);
    expect(screen.queryByText("Not clocked in")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No enrollments on file"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Contact HR/ })).toBeVisible();
  });

  it("shows known zero enrollments and clock state independently of another failed read", () => {
    mocks.paystub.mockReturnValue({ isLoading: false, isError: true });
    mocks.benefits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { enrollments: [] },
    });
    mocks.attendance.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { clockedIn: false, punches: [], calendarDate: "2026-11-14" },
    });
    render(<EmployeeHomeClient />);
    expect(screen.getByText("No enrollments on file")).toBeVisible();
    expect(screen.getByText("Not clocked in")).toBeVisible();
    expect(screen.getByText("Unavailable")).toBeVisible();
    expect(screen.getByText("Loading…")).toBeVisible();
  });

  it("keeps employee task content behind the existing sign-in gate", () => {
    mocks.access.mockReturnValue({ ready: true, isAuthenticated: false });
    render(<EmployeeHomeClient />);
    expect(
      screen.getByRole("heading", { name: "Sign in: Employee home" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /^Contact HR/ }),
    ).not.toBeInTheDocument();
  });
});

describe("task-first HR overview", () => {
  it("keeps the separate benefits queues and daily tasks available during loading", () => {
    render(<HrDashboardClient />);
    const tasks = within(
      screen.getByRole("region", { name: "Your daily operations" }),
    );
    expect(
      tasks.getByRole("link", { name: /^Benefit change requests/ }),
    ).toHaveAttribute("href", "/hr/benefits/election-change-requests");
    expect(tasks.getByRole("link", { name: /^Life events/ })).toHaveAttribute(
      "href",
      "/hr/benefits/life-events",
    );
    expect(
      tasks.getByRole("link", { name: /^Requests & corrections/ }),
    ).toHaveAttribute("href", "/hr/review-queue");
    expect(tasks.getByRole("link", { name: /^Payroll runs/ })).toHaveAttribute(
      "href",
      "/hr/payroll-runs",
    );
    expect(
      tasks.getByRole("link", { name: /^Onboarding templates/ }),
    ).toHaveAttribute("href", "/hr/onboarding-templates");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading operations summary",
    );
  });

  it("recovers a rejected summary request without hiding navigation", async () => {
    mocks.hrFetch.mockRejectedValueOnce(new Error("network unavailable"));
    mocks.hrFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: summary }),
    });
    render(<HrDashboardClient />);
    expect(
      await screen.findByText("Operations summary unavailable"),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /^Payroll runs/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry summary" }));
    await waitFor(() => expect(screen.getByText("42")).toBeVisible());
    expect(mocks.hrFetch).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByText("Operations summary unavailable"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "4 benefit change requests" }),
    ).toHaveAttribute("href", "/hr/benefits/election-change-requests");
    expect(
      screen.getByRole("link", {
        name: /Open recruiting in Manager workspace/,
      }),
    ).toHaveAttribute("href", "/manager/recruiting");
  });

  it("does not fetch or expose HR task content when signed out", () => {
    mocks.access.mockReturnValue({ ready: true, isAuthenticated: false });
    render(<HrDashboardClient />);
    expect(
      screen.getByRole("heading", { name: "Sign in: HR overview" }),
    ).toBeVisible();
    expect(mocks.hrFetch).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("link", { name: /^Payroll runs/ }),
    ).not.toBeInTheDocument();
  });
});
