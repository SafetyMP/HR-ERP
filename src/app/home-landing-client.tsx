"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  DollarSign,
  Heart,
  UserRound,
} from "lucide-react";

import {
  DEMO_PREVIEW_PERSONAS,
  demoPreviewBootstrapHref,
  type DemoPreviewPersona,
} from "@/lib/auth/demo-preview-config";
import { useDemoPreviewEnabled } from "@/lib/auth/use-demo-preview-enabled";
import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { DemoPersonaPicker } from "@/components/demo/demo-persona-picker";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { switchAccountRedirectTarget, useHrAccess } from "@/lib/auth/use-hr-access";

const DEMO_PREVIEW_ORDER: DemoPreviewPersona[] = ["employee", "manager", "hr"];

const ESS_QUICK_LINKS = [
  { href: "/employee/paystub", label: "Paystub", icon: DollarSign },
  { href: "/employee/time", label: "Time", icon: Clock },
  { href: "/employee/pto", label: "PTO", icon: Calendar },
  { href: "/employee/benefits", label: "Benefits", icon: Heart },
  { href: "/employee/profile", label: "Profile", icon: UserRound },
] as const;

export function HomeLandingClient() {
  const { ready, isAuthenticated, persistBearer, signOut } = useHrAccess();
  const demoPreviewEnabled = useDemoPreviewEnabled();

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16 lg:py-24">
        <PageHeader
          title="HR ERP"
          description="Unified employee self-service, manager workforce tools, and HR payroll operations."
        />

        {demoPreviewEnabled ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Try the product</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Open a live workspace as employee, manager, or HR — seeded with sample data.
              </p>
            </div>
            <DemoPersonaPicker />
          </section>
        ) : null}

        <HrSignInCard
          title={demoPreviewEnabled ? "Organization sign-in" : "Sign in"}
          description="Use your organization account for your tenant."
          returnTo="/employee"
          onDevTokenPaste={persistBearer}
          hideDemoPreview
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <PageHeader
        title="Welcome back"
        description="Jump to employee tasks or open a manager / HR workspace."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void signOut({ redirectTo: switchAccountRedirectTarget() });
            }}
          >
            Switch account
          </Button>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Employee
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button asChild variant="default" className="h-auto justify-start gap-3 py-3">
            <Link href="/employee">
              <DollarSign className="h-4 w-4 shrink-0" aria-hidden />
              Employee home
            </Link>
          </Button>
          {ESS_QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Button key={href} asChild variant="outline" className="h-auto justify-start gap-3 py-3">
              <Link href={href}>
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Manager & HR
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {DEMO_PREVIEW_ORDER.filter((p) => p !== "employee").map((persona) => {
            const spec = DEMO_PREVIEW_PERSONAS[persona];
            return (
              <Button key={persona} asChild variant="outline" className="h-auto flex-col gap-1 py-4">
                <Link
                  href={
                    demoPreviewEnabled
                      ? demoPreviewBootstrapHref(persona, spec.defaultReturnTo)
                      : spec.defaultReturnTo
                  }
                >
                  <span className="font-semibold">{spec.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">{spec.description}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
