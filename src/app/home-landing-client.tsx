"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  HeartHandshake,
  UserRound,
} from "lucide-react";
import { useDemoPreviewEnabled } from "@/lib/auth/use-demo-preview-enabled";
import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { DemoPersonaPicker } from "@/components/demo/demo-persona-picker";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  switchAccountRedirectTarget,
  useHrAccess,
} from "@/lib/auth/use-hr-access";

const WORKSPACES = [
  {
    href: "/employee",
    label: "Employee workspace",
    description: "Your pay, time off, benefits, and support.",
    icon: UserRound,
  },
  {
    href: "/hr/dashboard",
    label: "HR operations",
    description: "Employee requests, payroll, and benefits administration.",
    icon: HeartHandshake,
  },
  {
    href: "/manager/team-attendance",
    label: "Manager workspace",
    description: "Team attendance, leave, hiring, and performance.",
    icon: BriefcaseBusiness,
  },
];
const QUICK_LINKS = [
  { href: "/employee/paystub", label: "Pay statement" },
  { href: "/employee/time", label: "Time & attendance" },
  { href: "/employee/pto", label: "Time off" },
  { href: "/employee/benefits", label: "My benefits" },
  { href: "/employee/profile", label: "My profile" },
];

export function HomeLandingClient() {
  const { ready, isAuthenticated, persistBearer, signOut } = useHrAccess();
  const demoPreviewEnabled = useDemoPreviewEnabled();
  if (!ready)
    return (
      <p className="p-8 text-sm text-muted-foreground">Loading workspaces…</p>
    );

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-12 sm:px-8 lg:py-20"
    >
      <PageHeader
        eyebrow="HR ERP"
        title={
          isAuthenticated
            ? "A place for your workday"
            : "People. Work. One place."
        }
        description={
          isAuthenticated
            ? "Choose the workspace for the task ahead. Access follows your organization account."
            : "Find what you need, take the next step, and get back to your day."
        }
        actions={
          isAuthenticated ? (
            <Button
              variant="outline"
              onClick={() =>
                void signOut({ redirectTo: switchAccountRedirectTarget() })
              }
            >
              Switch account
            </Button>
          ) : undefined
        }
      />
      {isAuthenticated ? (
        <>
          <section
            aria-label="Workspaces"
            className="grid gap-4 md:grid-cols-3"
          >
            {WORKSPACES.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <span className="mb-7 flex size-12 items-center justify-center rounded-xl bg-primary-muted text-primary">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h2 className="text-lg font-semibold">{label}</h2>
                <p className="mt-2 min-h-12 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
                <span className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
                  Open workspace
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            ))}
          </section>
          <section aria-labelledby="employee-shortcuts">
            <h2 id="employee-shortcuts" className="mb-3 text-sm font-semibold">
              Employee shortcuts
            </h2>
            <div className="flex flex-wrap gap-2">
              {QUICK_LINKS.map((item) => (
                <Button key={item.href} asChild variant="outline">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <HrSignInCard
          title="Organization sign-in"
          description="Use your organization account to open your workspace."
          returnTo="/employee"
          onDevTokenPaste={persistBearer}
          hideDemoPreview
        />
      )}
      {demoPreviewEnabled ? (
        <section
          className="rounded-2xl border border-dashed border-border p-6"
          aria-labelledby="demo-workspaces"
        >
          <h2 id="demo-workspaces" className="text-base font-semibold">
            Explore with a demo identity
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Use sample data as an employee, manager, or HR professional.
            Choosing a demo persona changes your demo session.
          </p>
          <DemoPersonaPicker />
        </section>
      ) : null}
    </main>
  );
}
