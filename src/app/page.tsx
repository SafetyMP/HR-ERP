import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const examples = [
  {
    title: "Jurisdiction-driven payroll intake",
    description:
      "Select a locality — additional fields hydrate from `/api/mock/jurisdiction-fields`.",
    href: "/examples/jurisdiction",
  },
  {
    title: "Onboarding wizard state",
    description:
      "Zustand-managed steps with React Query remaining the future system of record.",
    href: "/examples/onboarding",
  },
  {
    title: "Org hierarchy explorer",
    description:
      "JSON tree mapped to disclosure-based navigation tuned for keyboards and screen readers.",
    href: "/examples/org",
  },
  {
    title: "Compensation tables & charts",
    description: "TanStack Table + Recharts interpreting the same sample payload.",
    href: "/examples/reporting",
  },
];

type DemoLink = { href: string; label: string; emphasis?: boolean };

function WorkflowSection({
  id,
  title,
  description,
  links,
}: {
  id: string;
  title: string;
  description: string;
  links: DemoLink[];
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-2xl border-2 border-border bg-card p-6 shadow-sm"
    >
      <div className="mb-5 border-l-4 border-primary pl-4">
        <h2 id={id} className="text-lg font-semibold tracking-tight text-card-foreground">
          {title}
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3" role="list">
        {links.map((link) => (
          <li key={link.href} className="list-none">
            <Button
              asChild
              variant={link.emphasis ? "default" : "outline"}
              size="lg"
              className="w-full justify-center sm:w-auto"
            >
              {link.href.startsWith("http") ? (
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ) : (
                <Link href={link.href}>{link.label}</Link>
              )}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  const employeeSelfService: DemoLink[] = [
    { href: "/employee/time", label: "Time & attendance", emphasis: true },
    { href: "/employee/performance/goals", label: "My performance goals", emphasis: true },
    { href: "/employee/learning", label: "My learning", emphasis: true },
    { href: "/employee/paystub", label: "Current earnings statement", emphasis: true },
    { href: "/employee/paystub/history", label: "Pay history" },
    { href: "/employee/benefits", label: "Benefits summary" },
    { href: "/employee/pto", label: "PTO" },
    { href: "/employee/benefits/election-change", label: "Benefits change intent" },
    { href: "/employee/profile", label: "My profile" },
    { href: "/employee/organization", label: "Organization context" },
    { href: "/employee/onboarding", label: "Onboarding tasks" },
    { href: "/employee/tax-documents", label: "Tax documents" },
    { href: "/employee/hr-request", label: "HR request" },
    { href: "/employee/leaving", label: "Leaving checklist" },
  ];

  const manager: DemoLink[] = [
    { href: "/manager/team-attendance", label: "Team attendance today", emphasis: true },
    { href: "/manager/recruiting", label: "Recruiting pipeline", emphasis: true },
    { href: "/manager/team-performance", label: "Team performance goals" },
    { href: "/manager/team-leave", label: "Team leave decisions" },
    { href: "/manager/punch-corrections", label: "Punch correction proposals" },
  ];

  const hrOps: DemoLink[] = [
    { href: "/hr/review-queue", label: "HR review queue", emphasis: true },
    { href: "/hr/payroll-runs", label: "Payroll runs", emphasis: true },
    { href: "/hr/onboarding-templates", label: "Onboarding templates" },
  ];

  const platformCapabilities: DemoLink[] = [
    { href: "/demo/capabilities", label: "Capability hub (Phase 3 snapshot)", emphasis: true },
    {
      href: "https://github.com/SafetyMP/HR-ERP/blob/main/contracts/openapi/core-hr-v1.yaml",
      label: "Core HR OpenAPI spec",
    },
  ];

  const analytics: DemoLink[] = [
    { href: "/analytics/churn", label: "Flight risk (churn)", emphasis: true },
    { href: "/analytics/skills", label: "Skills match" },
    { href: "/analytics/benchmarks", label: "Market benchmarks" },
    { href: "/global-l10n/profile", label: "Global L10n lab" },
  ];

  const bootstrapHint: ReactNode = (
    <>
      Run{" "}
      <code className="rounded-md bg-primary-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
        npm run demo:bootstrap
      </code>{" "}
      for predictive HR + Phase 3 seeds; set{" "}
      <code className="rounded-md bg-primary-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
        ANALYTICS_DEMO_MODE=1
      </code>{" "}
      and <code className="rounded-md bg-primary-muted px-1.5 py-0.5 font-mono text-xs text-foreground">DEMO_TENANT_ID</code> so{" "}
      <strong className="font-semibold text-card-foreground">/demo/capabilities</strong> and{" "}
      <strong className="font-semibold text-card-foreground">/analytics/*</strong> can read Postgres.
    </>
  );

  return (
    <div className="flex flex-col flex-1 bg-background">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:py-14">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
              HR ERP · local demo shell
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-card-foreground md:text-5xl">
              Task-first navigation
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Flows are grouped by role so you can scan less and act faster. Primary paths use solid buttons; everything
              else stays outlined for visual hierarchy—not color alone.
            </p>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground md:text-sm">
              <strong className="font-semibold text-card-foreground">Color blind–friendly palette:</strong> blue primary
              actions, orange destructive accents elsewhere in the system, and neutral chrome—avoiding red-vs-green as
              the only signal.
            </p>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 md:gap-14 md:py-16"
        tabIndex={-1}
      >
        <nav aria-label="Demo workflows by role" className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <WorkflowSection
              id="nav-employee"
              title="Employee self-service"
              description="Pay, time off, profile, and lifecycle tasks most employees open weekly."
              links={employeeSelfService}
            />
            <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              Learning enrollments and engagement pulse responses use{" "}
              <code className="rounded bg-background px-1 py-0.5 font-mono text-xs">
                /api/v1/me/*
              </code>{" "}
              — seed coverage is summarized on the{" "}
              <Link href="/demo/capabilities" className="font-medium text-primary underline underline-offset-4">
                capability hub
              </Link>
              .
            </p>
          </div>
          <WorkflowSection
            id="nav-manager"
            title="Manager"
            description="Team attendance, leave decisions, and escalation paths."
            links={manager}
          />
          <WorkflowSection
            id="nav-hr"
            title="HR operations"
            description="Queues and templates for people teams."
            links={hrOps}
          />

          <WorkflowSection
            id="nav-platform-capabilities"
            title="Platform capabilities (Phase 3)"
            description="Cross-role snapshot of performance, compensation, positions, learning, workflow, engagement, webhooks, and COBRA seeds — not analytics dashboards."
            links={platformCapabilities}
          />

          <section
            aria-labelledby="nav-analytics"
            className="rounded-2xl border-2 border-border bg-card p-6 shadow-sm"
          >
            <div className="mb-5 border-l-4 border-primary pl-4">
              <h2 id="nav-analytics" className="text-lg font-semibold tracking-tight text-card-foreground">
                Analytics &amp; global labs
              </h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                Predictive HR demos (churn, skills, benchmarks) and localization experiments. {bootstrapHint}
              </p>
            </div>
            <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3" role="list">
              {analytics.map((link) => (
                <li key={link.href} className="list-none">
                  <Button asChild variant="secondary" size="lg" className="w-full justify-center sm:w-auto">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="nav-examples-quick" className="rounded-2xl border-2 border-dashed border-border bg-primary-muted/60 p-6 dark:bg-primary-muted/25">
            <h2 id="nav-examples-quick" className="text-lg font-semibold text-card-foreground">
              Quick jumps (examples)
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Shortcut entry points into interactive demos and tooling.
            </p>
            <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3" role="list">
              <li className="list-none">
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/examples/jurisdiction">Payroll locality fields</Link>
                </Button>
              </li>
              <li className="list-none">
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/examples/reporting">Reporting sample</Link>
                </Button>
              </li>
              <li className="list-none">
                <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                  <Link href="/qa-lab">QA Lab</Link>
                </Button>
              </li>
            </ul>
          </section>
        </nav>

        <section aria-labelledby="examples-heading" className="border-t-2 border-border pt-12">
          <h2 id="examples-heading" className="text-2xl font-bold tracking-tight text-foreground">
            Pattern library
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Deeper UI experiments—same contrast rules as the rest of the shell.
          </p>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2" role="list">
            {examples.map((demo) => (
              <li key={demo.href} className="list-none">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{demo.title}</CardTitle>
                    <CardDescription>{demo.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild variant="secondary">
                      <Link href={demo.href}>Open pattern</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
