"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  Heart,
  MessageCircle,
  UserRound,
} from "lucide-react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { MetricCard } from "@/components/product/metric-card";
import { DashboardMetricsSkeleton } from "@/components/product/page-state";
import { useTodayAttendanceQuery } from "@/lib/attendance/use-today-attendance-query";
import { useBenefitsSummaryQuery } from "@/lib/benefits/use-benefits-summary-query";
import { useHrAccess } from "@/lib/auth/use-hr-access";
import { formatMoneyMinor } from "@/lib/paystub/format-money";
import { useCurrentPaystubQuery } from "@/lib/paystub/use-current-paystub-query";
import { formatBalanceHoursDisplay } from "@/lib/pto/format-balance-hours";
import { usePtoSummaryQuery } from "@/lib/pto/use-pto-summary-query";

type Props = { initialBearerToken?: string };

const EMPLOYEE_TASKS = [
  {
    href: "/employee/paystub",
    label: "Pay statement",
    detail: "See your latest earnings and deductions",
    icon: DollarSign,
  },
  {
    href: "/employee/time",
    label: "Time & attendance",
    detail: "Clock in, clock out, or check your hours",
    icon: Clock,
  },
  {
    href: "/employee/pto",
    label: "Time off",
    detail: "Check your balance and request leave",
    icon: Calendar,
  },
  {
    href: "/employee/benefits",
    label: "My benefits",
    detail: "Review your coverage and request changes",
    icon: Heart,
  },
  {
    href: "/employee/profile",
    label: "My profile",
    detail: "Update your personal and contact details",
    icon: UserRound,
  },
  {
    href: "/employee/hr-request",
    label: "Contact HR",
    detail: "Ask a question or follow up on a request",
    icon: MessageCircle,
  },
];

export function EmployeeHomeClient({ initialBearerToken }: Props) {
  const { ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const paystub = useCurrentPaystubQuery();
  const pto = usePtoSummaryQuery();
  const attendance = useTodayAttendanceQuery();
  const benefits = useBenefitsSummaryQuery();

  if (!ready) return <DashboardMetricsSkeleton />;
  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="Employee home"
        description="Sign in to view pay, time, leave, and benefits in one place."
        returnTo="/employee"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  const enrollmentCount = benefits.data?.enrollments.length;
  const hasSummaryError =
    paystub.isError || pto.isError || attendance.isError || benefits.isError;

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="employee-tasks-title">
        <div className="mb-4">
          <h2
            id="employee-tasks-title"
            className="text-xl font-semibold tracking-tight"
          >
            What would you like to do?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your everyday tasks, all within reach.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {EMPLOYEE_TASKS.map(({ href, label, detail, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-foreground">
                  {label}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {detail}
                </span>
              </span>
              <ArrowRight
                className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-primary"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="employee-summary-title">
        <h2
          id="employee-summary-title"
          className="mb-4 text-xl font-semibold tracking-tight"
        >
          Your overview
        </h2>
        {hasSummaryError ? (
          <p className="mb-4 text-sm text-muted-foreground" role="status">
            Some summaries could not be loaded. Open a task above to view its
            details or try again.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Latest net pay"
            icon={DollarSign}
            value={
              paystub.isLoading || paystub.isPending
                ? "Loading…"
                : paystub.isError || paystub.data === undefined
                  ? "Unavailable"
                  : paystub.data
                    ? formatMoneyMinor(
                        paystub.data.netPayMinor,
                        paystub.data.currencyCode,
                      )
                    : "—"
            }
            detail={
              paystub.isLoading || paystub.isPending
                ? "Getting your pay statement"
                : paystub.isError || paystub.data === undefined
                  ? "Open Pay statement to try again"
                  : paystub.data
                    ? `Pay period ${paystub.data.payPeriodStart} – ${paystub.data.payPeriodEnd}`
                    : "No earnings statement posted yet"
            }
          />
          <MetricCard
            label="Time today"
            icon={Clock}
            value={
              attendance.isLoading || attendance.isPending
                ? "Loading…"
                : attendance.isError || !attendance.data
                  ? "Unavailable"
                  : attendance.data.clockedIn
                    ? "Clocked in"
                    : "Not clocked in"
            }
            detail={
              attendance.isLoading || attendance.isPending
                ? "Checking your attendance"
                : attendance.isError || !attendance.data
                  ? "Open Time & attendance to try again"
                  : attendance.data.openShiftFromPriorDay &&
                      attendance.data.clockedIn
                    ? "Open shift from prior day — review your attendance"
                    : `${attendance.data.punches.length} punch${attendance.data.punches.length === 1 ? "" : "es"} on ${attendance.data.calendarDate}`
            }
          />
          <MetricCard
            label="Time off balance"
            icon={Calendar}
            value={
              pto.isLoading || pto.isPending
                ? "Loading…"
                : pto.isError || !pto.data
                  ? "Unavailable"
                  : pto.data.balanceHours != null
                    ? `${formatBalanceHoursDisplay(pto.data.balanceHours)} hrs`
                    : "—"
            }
            detail={
              pto.isLoading || pto.isPending
                ? "Getting your available hours"
                : pto.isError || !pto.data
                  ? "Open Time off to try again"
                  : pto.data.balanceAsOfDate
                    ? `As of ${pto.data.balanceAsOfDate}`
                    : "Balance not posted yet"
            }
          />
          <MetricCard
            label="Benefit plans"
            icon={Heart}
            value={
              benefits.isLoading || benefits.isPending
                ? "Loading…"
                : benefits.isError || enrollmentCount == null
                  ? "Unavailable"
                  : enrollmentCount
            }
            detail={
              benefits.isLoading || benefits.isPending
                ? "Checking your enrollments"
                : benefits.isError || enrollmentCount == null
                  ? "Open My benefits to try again"
                  : enrollmentCount > 0
                    ? "Active enrollments on file"
                    : "No enrollments on file"
            }
          />
        </div>
      </section>
    </div>
  );
}
