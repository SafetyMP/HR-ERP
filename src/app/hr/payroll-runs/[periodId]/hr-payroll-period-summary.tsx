"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type PayrollPeriodSummaryProps = {
  periodLabel: string;
  status: string;
  employeeCount: number;
  exceptionCount: number;
};

export function HrPayrollPeriodSummary({
  periodLabel,
  status,
  employeeCount,
  exceptionCount,
}: PayrollPeriodSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{periodLabel}</CardTitle>
        <CardDescription>Status: {status}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground">Employees in run:</span>{" "}
          {employeeCount}
        </p>
        <p>
          <span className="font-medium text-foreground">Open exceptions:</span>{" "}
          {exceptionCount}
        </p>
      </CardContent>
    </Card>
  );
}
