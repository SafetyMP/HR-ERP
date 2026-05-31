"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  DollarSign,
  Heart,
  UserRound,
} from "lucide-react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { MetricCard } from "@/components/product/metric-card";
import { DashboardMetricsSkeleton } from "@/components/product/page-state";
import { StatusPill } from "@/components/product/status-pill";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTodayAttendanceQuery } from "@/lib/attendance/use-today-attendance-query";
import { useBenefitsSummaryQuery } from "@/lib/benefits/use-benefits-summary-query";
import { useHrAccess } from "@/lib/auth/use-hr-access";
import { formatMoneyMinor } from "@/lib/paystub/format-money";
import { useCurrentPaystubQuery } from "@/lib/paystub/use-current-paystub-query";
import { formatBalanceHoursDisplay } from "@/lib/pto/format-balance-hours";
import { usePtoSummaryQuery } from "@/lib/pto/use-pto-summary-query";

type Props = {
  initialBearerToken?: string;
};

export function EmployeeHomeClient({ initialBearerToken }: Props) {
  const { ready, isAuthenticated, persistBearer } = useHrAccess(initialBearerToken);
  const paystub = useCurrentPaystubQuery();
  const pto = usePtoSummaryQuery();
  const attendance = useTodayAttendanceQuery();
  const benefits = useBenefitsSummaryQuery();

  if (!ready) {
    return <DashboardMetricsSkeleton />;
  }

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

  const loading =
    paystub.isLoading ||
    pto.isLoading ||
    attendance.isLoading ||
    benefits.isLoading;

  if (loading) {
    return <DashboardMetricsSkeleton />;
  }

  const enrollmentCount = benefits.data?.enrollments?.length ?? 0;
  const cc = paystub.data?.currencyCode ?? "USD";

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Latest net pay"
          icon={DollarSign}
          href="/employee/paystub"
          value={
            paystub.data
              ? formatMoneyMinor(paystub.data.netPayMinor, cc)
              : "—"
          }
          detail={
            paystub.data
              ? `Pay period ${paystub.data.payPeriodStart} – ${paystub.data.payPeriodEnd}`
              : "No earnings statement posted yet"
          }
        />
        <MetricCard
          label="Time today"
          icon={Clock}
          href="/employee/time"
          accent={attendance.data?.clockedIn ? "success" : "muted"}
          value={attendance.data?.clockedIn ? "Clocked in" : "Not clocked in"}
          detail={
            attendance.data
              ? attendance.data.openShiftFromPriorDay && attendance.data.clockedIn
                ? "Open shift from prior day — clock out on Time"
                : `${attendance.data.punches.length} punch${attendance.data.punches.length === 1 ? "" : "es"} on ${attendance.data.calendarDate}`
              : "View attendance"
          }
        />
        <MetricCard
          label="PTO balance"
          icon={Calendar}
          href="/employee/pto"
          value={
            pto.data?.balanceHours != null
              ? `${formatBalanceHoursDisplay(pto.data.balanceHours)} hrs`
              : "—"
          }
          detail={
            pto.data?.balanceAsOfDate
              ? `As of ${pto.data.balanceAsOfDate}`
              : "Balance not posted yet"
          }
        />
        <MetricCard
          label="Benefit plans"
          icon={Heart}
          href="/employee/benefits"
          value={enrollmentCount}
          detail={
            enrollmentCount > 0
              ? "Active enrollments on file"
              : "No enrollments yet — request changes in-app"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Today at a glance</CardTitle>
            <CardDescription>
              Common employee tasks — each opens the full detail view.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/employee/paystub", label: "Earnings statement", icon: DollarSign },
              { href: "/employee/time", label: "Clock in / out", icon: Clock },
              { href: "/employee/pto", label: "PTO & requests", icon: Calendar },
              { href: "/employee/profile", label: "My profile", icon: UserRound },
            ].map(({ href, label, icon: Icon }) => (
              <Button key={href} asChild variant="outline" className="h-auto justify-start gap-3 py-3">
                <Link href={href}>
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{label}</span>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Payroll</span>
              {paystub.data ? (
                <StatusPill variant="success">Statement available</StatusPill>
              ) : (
                <StatusPill variant="neutral">No statement yet</StatusPill>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Attendance</span>
              {attendance.data?.clockedIn ? (
                <StatusPill variant="success">On the clock</StatusPill>
              ) : (
                <StatusPill variant="neutral">Off the clock</StatusPill>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Benefits</span>
              {enrollmentCount > 0 ? (
                <StatusPill variant="success">{enrollmentCount} active</StatusPill>
              ) : (
                <StatusPill variant="warning">Review enrollments</StatusPill>
              )}
            </div>
            <Button asChild size="sm" className="mt-2 w-full">
              <Link href="/employee/benefits/election-change">Request benefit change</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
