"use client";

import Link from "next/link";
import { Calendar, Clock, DollarSign, Heart } from "lucide-react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import {
  demoPreviewBootstrapHref,
  demoPreviewSignInUiEnabled,
  type DemoPreviewPersona,
} from "@/lib/auth/demo-preview-config";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useHrAccess } from "@/lib/auth/use-hr-access";

const QUICK_ACTIONS = [
  { href: "/employee/paystub", label: "Paystub", icon: DollarSign },
  { href: "/employee/time", label: "Time", icon: Clock },
  { href: "/employee/pto", label: "PTO", icon: Calendar },
  { href: "/employee/benefits", label: "Benefits", icon: Heart },
] as const;

const ROLE_HUBS: ReadonlyArray<{
  href: string;
  title: string;
  description: string;
  persona: DemoPreviewPersona;
}> = [
  {
    href: "/employee/paystub",
    title: "Employee",
    description: "Pay, time off, benefits, and profile.",
    persona: "employee",
  },
  {
    href: "/manager/team-attendance",
    title: "Manager",
    description: "Team attendance, leave, and recruiting.",
    persona: "manager",
  },
  {
    href: "/hr/dashboard",
    title: "HR operations",
    description: "Dashboard, payroll runs, and queues.",
    persona: "hr",
  },
] as const;

export function HomeLandingClient() {
  const { ready, isAuthenticated, persistBearer } = useHrAccess();
  const demoPreviewEnabled = demoPreviewSignInUiEnabled();

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
        <PageHeader
          title="HR ERP"
          description="One portal for pay, time, leave, benefits, and HR operations—built for mid-market teams."
        />
        <HrSignInCard
          title="Sign in"
          description="Use your organization account to continue."
          returnTo="/employee/paystub"
          onDevTokenPaste={persistBearer}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLE_HUBS.map((hub) => (
            <Card key={hub.href}>
              <CardHeader>
                <CardTitle className="text-base">{hub.title}</CardTitle>
                <CardDescription>{hub.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={
                      demoPreviewEnabled
                        ? demoPreviewBootstrapHref(hub.persona, hub.href)
                        : hub.href
                    }
                  >
                    {demoPreviewEnabled ? "Preview signed in" : "Preview hub"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <PageHeader
        title="Welcome back"
        description="Jump to a common task or use the sidebar on any employee, manager, or HR page."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
          <Button key={href} asChild variant="default" size="lg" className="h-auto justify-start gap-3 py-4">
            <Link href={href}>
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {label}
            </Link>
          </Button>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Other areas</CardTitle>
          <CardDescription>Manager and HR tools stay in their own navigation shells.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/manager/team-attendance">Manager</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/hr/dashboard">HR dashboard</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/demo/capabilities">Platform capabilities</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
