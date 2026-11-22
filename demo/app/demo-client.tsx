"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  Heart,
  LayoutDashboard,
  Menu,
  MessageSquare,
  RotateCcw,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  navGroupsForRole,
  navForRole,
  roleLabel,
  type NavItem,
} from "../../src/lib/navigation/role-nav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../../src/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "../../src/components/ui/sheet";
import {
  DEMO_ROUTE_SET,
  initialRequests,
  PAGE_DESCRIPTIONS,
  TIME_OFF_OPTIONS,
  type DemoRequest,
  type DemoRole,
  type RequestStatus,
} from "./demo-model";

import { ReleaseCase } from "./release-case";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent";
const iconMap: Record<string, LucideIcon> = {
  "/employee": LayoutDashboard,
  "/employee/paystub": DollarSign,
  "/employee/time": Clock,
  "/employee/pto": Calendar,
  "/employee/benefits": Heart,
  "/employee/hr-request": MessageSquare,
  "/hr/dashboard": LayoutDashboard,
  "/hr/review-queue": Users,
  "/hr/payroll-runs": DollarSign,
};

function subscribeRoute(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
function currentRoute() {
  return window.location.hash.slice(1) || "/case";
}
function routeRole(route: string): DemoRole {
  return route.startsWith("/hr/") ? "hr" : "employee";
}
function labelFor(route: string) {
  return (
    navForRole(routeRole(route)).find((item) => item.href === route)?.label ??
    "Page not included"
  );
}
function goTo(route: string) {
  window.location.hash = route;
}

function Status({
  value,
}: {
  value: RequestStatus | "Ready for review" | "Completed" | "Sample data";
}) {
  const success = value === "Approved" || value === "Completed";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${success ? "border-primary/20 bg-primary-muted text-primary" : "border-border bg-muted/60 text-muted-foreground"}`}
    >
      {success ? <Check className="h-3 w-3" aria-hidden /> : null}
      {value}
    </span>
  );
}
function Panel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 ${className}`}
    >
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
function TaskLink({
  href,
  detail,
  prominent = false,
}: {
  href: string;
  detail: string;
  prominent?: boolean;
}) {
  const Icon = iconMap[href] ?? ArrowRight;
  return (
    <a
      href={`#${href}`}
      className={`group flex min-h-24 items-center gap-4 rounded-xl border p-4 transition ${prominent ? "border-primary/25 bg-primary-muted hover:border-primary" : "border-border bg-card hover:border-primary/50 hover:bg-accent/40"}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{labelFor(href)}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {detail}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-primary transition group-hover:translate-x-0.5"
        aria-hidden
      />
    </a>
  );
}
function Summary({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

function DemoNavigation({
  role,
  route,
  onNavigate,
}: {
  role: DemoRole;
  route: string;
  onNavigate: () => void;
}) {
  const groups = navGroupsForRole(role)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => DEMO_ROUTE_SET.has(item.href)),
    }))
    .filter((group) => group.items.length > 0);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-6 pb-6 pt-7">
        <a
          href={`#${role === "employee" ? "/employee" : "/hr/dashboard"}`}
          onClick={onNavigate}
          className="inline-flex items-center gap-3 font-semibold tracking-tight"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm text-primary-foreground">
            <Building2 className="h-5 w-5" aria-hidden />
          </span>
          <span>
            HR ERP
            <span className="mt-0.5 block text-xs font-normal tracking-normal text-muted-foreground">
              People, connected.
            </span>
          </span>
        </a>
      </div>
      <div className="mx-4 mb-5 rounded-xl bg-muted/60 p-3">
        <p className="text-xs font-medium text-muted-foreground">
          DEMO WORKSPACE
        </p>
        <p className="mt-1 text-sm font-semibold">{roleLabel(role)}</p>
      </div>
      <nav
        aria-label={`${roleLabel(role)} demo navigation`}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 pb-5"
      >
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = iconMap[item.href] ?? ArrowRight;
                return (
                  <li key={item.href}>
                    <a
                      href={`#${item.href}`}
                      onClick={onNavigate}
                      aria-current={route === item.href ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${route === item.href ? "bg-primary-muted text-primary shadow-[inset_3px_0_0_var(--primary)]" : "text-sidebar-foreground hover:bg-accent"}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-semibold">
            {role === "employee" ? "AM" : "JR"}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {role === "employee" ? "Alex Morgan" : "Jamie Reed"}
            </p>
            <p className="text-xs text-muted-foreground">
              {role === "employee" ? "Employee" : "HR professional"} · sample
              persona
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageFinder({ role }: { role: DemoRole }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const resultsRef = useRef<HTMLUListElement>(null);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = navForRole(role).filter((item: NavItem) => {
    if (!DEMO_ROUTE_SET.has(item.href)) return false;
    const text = [
      item.label,
      item.description ?? "",
      ...(item.keywords ?? []),
      PAGE_DESCRIPTIONS[item.href],
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => text.includes(term));
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          (target.matches("input, textarea, select") ||
            target.isContentEditable ||
            target.closest('[role="dialog"]'))
        ) {
          return;
        }
        event.preventDefault();
        setQuery("");
        setOpen(true);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setQuery("");
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"
          aria-label="Find a page"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Find a page</span>
          <kbd className="ml-5 hidden rounded border border-border px-1.5 py-0.5 text-[10px] lg:inline">
            ⌘ / Ctrl K
          </kbd>
        </button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card text-foreground">
        <DialogTitle>Find a page</DialogTitle>
        <DialogDescription>
          Search this {roleLabel(role).toLowerCase()} demo workspace.
        </DialogDescription>
        <label htmlFor="demo-page-search" className="sr-only">
          Page or task
        </label>
        <input
          id="demo-page-search"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              const firstResult = resultsRef.current?.querySelector("a");
              if (firstResult) {
                event.preventDefault();
                firstResult.focus();
              }
            }
          }}
          placeholder={
            role === "employee"
              ? "Try vacation, pay, or help…"
              : "Try requests or payroll…"
          }
          className="min-h-12 w-full rounded-lg border border-border bg-background px-3 text-sm"
        />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {matches.length} {matches.length === 1 ? "page" : "pages"} found
        </p>
        <ul ref={resultsRef} className="max-h-72 space-y-1 overflow-auto">
          {matches.map((item) => (
            <li key={item.href}>
              <a
                href={`#${item.href}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="flex min-h-12 items-center justify-between gap-3 rounded-lg p-3 text-sm font-medium hover:bg-accent"
              >
                {item.label}
                <ArrowRight className="h-4 w-4 text-primary" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
        {matches.length === 0 ? (
          <p className="rounded-lg bg-muted p-4 text-sm">
            No matching page. Try a shorter task name, or clear your search.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EmployeeHome({
  requests,
  clockedIn,
}: {
  requests: DemoRequest[];
  clockedIn: boolean;
}) {
  const own = requests.filter((request) => request.employee === "Alex Morgan");
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-primary/20 bg-primary-muted p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            A little less admin
          </p>
          <h2 className="mt-3 max-w-md text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            Everything you need.
            <br />
            Room for your workday.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Check your pay, plan time away, and get answers from HR. Start with
            what matters to you.
          </p>
          <a className={`${buttonClass} mt-6`} href="#/employee/pto">
            Plan time off
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </section>
        <Panel
          title="Your next steps"
          description="A clear path through the demo."
        >
          <ol className="space-y-5">
            {[
              "Request time off in your employee workspace.",
              "Switch to HR and review the request.",
              "Come back here to see the updated status.",
            ].map((step, index) => (
              <li className="flex gap-3 text-sm leading-relaxed" key={step}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
      <section aria-labelledby="employee-tasks">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="employee-tasks" className="text-lg font-semibold">
            What would you like to do?
          </h2>
          <span className="text-xs text-muted-foreground">
            Your everyday essentials
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TaskLink
            href="/employee/paystub"
            detail="Review your latest earnings"
          />
          <TaskLink
            href="/employee/time"
            detail={
              clockedIn
                ? "Clocked in · manage your shift"
                : "Not clocked in · start your shift"
            }
          />
          <TaskLink
            href="/employee/benefits"
            detail="See your plans and coverage"
          />
          <TaskLink
            href="/employee/hr-request"
            detail="Find help with an HR question"
          />
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary
          label="Latest net pay"
          value="$3,240.00"
          detail="Sample statement · Nov 1–15, 2026"
        />
        <Summary
          label="Time off available"
          value={`${80 - own.filter((r) => r.status === "Approved").reduce((total, r) => total + r.hours, 0)} hrs`}
          detail="Sample annual leave balance"
        />
        <Summary
          label="Your requests"
          value={String(own.filter((r) => r.status === "Pending").length)}
          detail="Awaiting a demo review"
        />
      </div>
      {own.length > 0 ? (
        <Panel title="Your recent requests">
          <RequestList requests={own} />
          <a
            href="#/employee/pto"
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
          >
            View time off
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </Panel>
      ) : null}
    </div>
  );
}
function RequestList({ requests }: { requests: DemoRequest[] }) {
  return (
    <ul className="divide-y divide-border">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
        >
          <div>
            <p className="text-sm font-semibold">{request.dates}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Annual leave · {request.hours} hours · {request.id}
            </p>
          </div>
          <Status value={request.status} />
        </li>
      ))}
    </ul>
  );
}
function TimeOff({
  requests,
  onRequest,
}: {
  requests: DemoRequest[];
  onRequest: (index: number) => void;
}) {
  const [selected, setSelected] = useState("0");
  const own = requests.filter((request) => request.employee === "Alex Morgan");
  const selectedOption = TIME_OFF_OPTIONS[Number(selected)];
  const alreadyRequested = own.some(
    (request) =>
      request.dates === selectedOption?.dates && request.status !== "Declined",
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <Panel
        title="Request time off"
        description="Choose one of the sample dates to try the request journey."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!alreadyRequested) onRequest(Number(selected));
          }}
          className="space-y-5"
        >
          <div className="rounded-xl bg-primary-muted p-4">
            <p className="text-sm text-muted-foreground">Available balance</p>
            <p className="mt-1 text-2xl font-semibold">
              {80 -
                own
                  .filter((r) => r.status === "Approved")
                  .reduce((total, r) => total + r.hours, 0)}{" "}
              hours
            </p>
          </div>
          <div>
            <label
              htmlFor="demo-leave-dates"
              className="mb-2 block text-sm font-semibold"
            >
              Sample dates
            </label>
            <select
              id="demo-leave-dates"
              className="min-h-12 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              {TIME_OFF_OPTIONS.map((option, index) => (
                <option value={String(index)} key={option.dates}>
                  {option.dates} · {option.hours} hours
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your request will appear in the HR demo queue. Approval updates the
            sample balance; pending requests do not deduct hours.
          </p>
          <button
            type="submit"
            className={buttonClass}
            disabled={alreadyRequested}
          >
            {alreadyRequested ? "Already requested" : "Submit sample request"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </Panel>
      <Panel
        title="Your requests"
        description="Follow the status without chasing an email."
      >
        {own.length ? (
          <RequestList requests={own} />
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Calendar
              className="mx-auto h-7 w-7 text-muted-foreground"
              aria-hidden
            />
            <p className="mt-3 font-medium">No requests yet</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Submit a sample request to see it here.
            </p>
          </div>
        )}
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            To continue the walkthrough, use “Demo workspace” above to switch to
            HR operations.
          </p>
        </div>
      </Panel>
    </div>
  );
}
function PayStatement() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Panel
        title="Current earnings statement"
        description="November 1–15, 2026 · Sample biweekly statement"
      >
        <div className="rounded-xl bg-primary-muted p-6">
          <p className="text-sm text-muted-foreground">Net pay</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            $3,240.00
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Sample pay date · November 20, 2026
          </p>
        </div>
        <dl className="mt-5 divide-y divide-border">
          {[
            ["Gross earnings", "$4,200.00"],
            ["Taxes (illustrative)", "−$700.00"],
            ["Benefit deductions", "−$260.00"],
            ["Net pay", "$3,240.00"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-4 py-4 text-sm"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel
        title="Know where to go next"
        description="Keep related tasks within reach."
      >
        <div className="space-y-3">
          <TaskLink
            href="/employee/benefits"
            detail="Understand the plans on this statement"
          />
          <TaskLink
            href="/employee/hr-request"
            detail="Get help with a pay question"
          />
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Illustrative figures only. This preview does not calculate payroll or
          produce official pay documents.
        </p>
      </Panel>
    </div>
  );
}
function Benefits() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Medical", "Horizon PPO", "$180 / pay period", "Employee coverage"],
          [
            "Dental",
            "Everyday Dental",
            "$45 / pay period",
            "Preventive and routine care",
          ],
          [
            "Vision",
            "Clear View",
            "$35 / pay period",
            "Annual exam and lenses",
          ],
        ].map(([type, name, cost, detail]) => (
          <Panel key={type} title={type} description={detail}>
            <Heart className="h-7 w-7 text-primary" aria-hidden />
            <h3 className="mt-5 text-lg font-semibold">{name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{cost}</p>
            <p className="mt-5 text-xs font-medium text-primary">
              Sample enrollment · Active
            </p>
          </Panel>
        ))}
      </div>
      <Panel
        title="A change in your life?"
        description="For a move, family change, or question about coverage, start with HR."
      >
        <TaskLink
          href="/employee/hr-request"
          detail="Find your next step for benefits support"
        />
      </Panel>
    </div>
  );
}
function ContactHR({ sent, onSend }: { sent: boolean; onSend: () => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="How can HR help?"
        description="Try a sample question without entering personal information."
      >
        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sample question · Benefits
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            Where can I find more information about my medical plan coverage?
          </p>
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={sent}
          className={`${buttonClass} mt-5`}
        >
          {sent ? "Sample question sent" : "Send sample question"}
          {sent ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden />
          )}
        </button>
        {sent ? (
          <p className="mt-4 text-sm leading-relaxed" role="status">
            Demo confirmation HR-201. Your sample question is recorded for this
            browser session only. Nothing was sent to an HR team.
          </p>
        ) : null}
      </Panel>
      <Panel
        title="Before you ask"
        description="Your answer may already be a click away."
      >
        <div className="space-y-3">
          <TaskLink
            href="/employee/paystub"
            detail="Earnings and sample deductions"
          />
          <TaskLink
            href="/employee/benefits"
            detail="Your active benefit plans"
          />
          <TaskLink
            href="/employee/pto"
            detail="Your balance and request status"
          />
        </div>
      </Panel>
    </div>
  );
}
function TimeAttendance({
  clockedIn,
  onToggle,
}: {
  clockedIn: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Today's shift"
        description="Monday, November 16, 2026 · Illustrative workday"
      >
        <div className="rounded-xl bg-primary-muted p-6">
          <Clock className="h-7 w-7 text-primary" aria-hidden />
          <p className="mt-4 text-2xl font-semibold">
            {clockedIn ? "You're clocked in" : "You're not clocked in"}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Try a clock action to see the status update across your workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`${buttonClass} mt-5`}
        >
          {clockedIn ? "Clock out in demo" : "Clock in in demo"}
        </button>
        <p className="mt-4 text-xs text-muted-foreground">
          No real attendance record or payroll calculation is created.
        </p>
      </Panel>
      <Panel title="Planning time away?">
        <TaskLink
          href="/employee/pto"
          detail="View your balance and request time off"
        />
      </Panel>
    </div>
  );
}
function HrHome({ requests }: { requests: DemoRequest[] }) {
  const pending = requests.filter((request) => request.status === "Pending");
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-primary/20 bg-primary-muted p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Your attention, where it matters
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {pending.length
              ? `${pending.length} ${pending.length === 1 ? "request is" : "requests are"} ready for review`
              : "You're up to date"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Bring the next decision into focus, then get back to your people.
          </p>
        </div>
        <a className={buttonClass} href="#/hr/review-queue">
          Review requests
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary
          label="Requests awaiting review"
          value={String(pending.length)}
          detail="Sample time off requests"
        />
        <Summary
          label="Active employees"
          value="128"
          detail="Synthetic organization · 6 departments"
        />
        <Summary
          label="Upcoming payroll"
          value="Nov 20"
          detail="Sample run · Ready for review"
        />
      </div>
      <section aria-labelledby="hr-tasks">
        <h2 id="hr-tasks" className="mb-4 text-lg font-semibold">
          Keep work moving
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TaskLink
            href="/hr/review-queue"
            detail="Review dates, hours, and request status"
          />
          <TaskLink
            href="/hr/payroll-runs"
            detail="See pay run progress and next steps"
          />
        </div>
      </section>
      <Panel
        title="One connected walkthrough"
        description="See the experience from both sides."
      >
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Switch the demo workspace to Employee to request time off as Alex
          Morgan. Return here to review it, then check the employee view for the
          outcome. The same sample request stays connected as you move between
          workspaces.
        </p>
      </Panel>
    </div>
  );
}
function ReviewQueue({
  requests,
  onDecide,
}: {
  requests: DemoRequest[];
  onDecide: (id: string, status: RequestStatus) => void;
}) {
  const pending = requests.filter((request) => request.status === "Pending");
  return (
    <div className="space-y-6">
      <Panel
        title="Time off requests"
        description="Illustrative HR triage for this demo. Production approval roles and policies are unchanged."
      >
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-xl border border-border p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{request.employee}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sample employee · {request.id}
                  </p>
                </div>
                <Status value={request.status} />
              </div>
              <dl className="my-5 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Dates</dt>
                  <dd className="mt-1 font-medium">{request.dates}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Time requested</dt>
                  <dd className="mt-1 font-medium">{request.hours} hours</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Leave type</dt>
                  <dd className="mt-1 font-medium">Annual leave</dd>
                </div>
              </dl>
              {request.status === "Pending" ? (
                <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => onDecide(request.id, "Approved")}
                    aria-label={`Approve ${request.employee} request ${request.id}`}
                  >
                    Approve request
                    <Check className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={secondaryClass}
                    onClick={() => onDecide(request.id, "Declined")}
                    aria-label={`Decline ${request.employee} request ${request.id}`}
                  >
                    Decline request
                  </button>
                </div>
              ) : (
                <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                  Demo decision recorded. The employee can now see this status.
                </p>
              )}
            </article>
          ))}
        </div>
        {pending.length === 0 ? (
          <p className="mt-5 rounded-xl bg-primary-muted p-4 text-sm font-medium">
            All sample requests have been reviewed.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
function PayrollRuns() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-6">
      <Panel
        title="Upcoming pay run"
        description="Nov 1–15, 2026 · Biweekly payroll"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Sample gross payroll
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              $537,600.00
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              128 sample employees · Pay date November 20
            </p>
          </div>
          <Status value="Ready for review" />
        </div>
        <button
          type="button"
          className={`${secondaryClass} mt-6`}
          aria-expanded={expanded}
          aria-controls="demo-payroll-checklist"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide review checklist" : "View review checklist"}
          <ChevronRight
            className={`h-4 w-4 ${expanded ? "rotate-90" : ""}`}
            aria-hidden
          />
        </button>
        {expanded ? (
          <div
            id="demo-payroll-checklist"
            className="mt-5 rounded-xl bg-background p-5"
          >
            <h3 className="font-semibold">Sample review checklist</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Confirm employee roster and scheduled hours",
                "Review earnings and deduction changes",
                "Resolve exceptions before approving a run",
              ].map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="font-semibold text-primary">
                    {index + 1}.
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              This is a navigation preview. It cannot approve payroll, send
              payments, or export employee data.
            </p>
          </div>
        ) : null}
      </Panel>
      <Panel title="Previous run">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium">October 16–31, 2026</p>
            <p className="mt-1 text-sm text-muted-foreground">
              128 sample employees · Paid November 5
            </p>
          </div>
          <Status value="Completed" />
        </div>
      </Panel>
    </div>
  );
}

export function DemoClient() {
  const route = useSyncExternalStore(
    subscribeRoute,
    currentRoute,
    () => "/case",
  );
  const role = routeRole(route);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [requests, setRequests] = useState(initialRequests);
  const [clockedIn, setClockedIn] = useState(false);
  const [questionSent, setQuestionSent] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const lastRoute = useRef(route);
  useEffect(() => {
    if (lastRoute.current !== route) {
      mainRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
      lastRoute.current = route;
    }
  }, [route]);
  function requestTimeOff(index: number) {
    const option = TIME_OFF_OPTIONS[index];
    if (!option) return;
    setRequests((existing) => {
      if (
        existing.some(
          (request) =>
            request.employee === "Alex Morgan" &&
            request.dates === option.dates &&
            request.status !== "Declined",
        )
      )
        return existing;
      return [
        ...existing,
        {
          id: `DEMO-${102 + existing.length - 1}`,
          employee: "Alex Morgan",
          dates: option.dates,
          hours: option.hours,
          status: "Pending",
        },
      ];
    });
    setAnnouncement(
      `Sample time off request submitted for ${option.dates}. Status: Pending.`,
    );
  }
  function decide(id: string, status: RequestStatus) {
    setRequests((existing) =>
      existing.map((request) =>
        request.id === id && request.status === "Pending"
          ? { ...request, status }
          : request,
      ),
    );
    setAnnouncement(
      `${id}: ${status}. Switch to Employee to see the updated request.`,
    );
  }
  function reset() {
    setRequests(initialRequests());
    setClockedIn(false);
    setQuestionSent(false);
    setAnnouncement(
      "Demo reset. All sample requests and actions have returned to their starting state.",
    );
    goTo("/employee");
  }
  function content() {
    switch (route) {
      case "/employee":
        return <EmployeeHome requests={requests} clockedIn={clockedIn} />;
      case "/employee/paystub":
        return <PayStatement />;
      case "/employee/time":
        return (
          <TimeAttendance
            clockedIn={clockedIn}
            onToggle={() => {
              setClockedIn(!clockedIn);
              setAnnouncement(
                clockedIn
                  ? "Demo status: clocked out."
                  : "Demo status: clocked in.",
              );
            }}
          />
        );
      case "/employee/pto":
        return <TimeOff requests={requests} onRequest={requestTimeOff} />;
      case "/employee/benefits":
        return <Benefits />;
      case "/employee/hr-request":
        return (
          <ContactHR sent={questionSent} onSend={() => setQuestionSent(true)} />
        );
      case "/hr/dashboard":
        return <HrHome requests={requests} />;
      case "/hr/review-queue":
        return <ReviewQueue requests={requests} onDecide={decide} />;
      case "/hr/payroll-runs":
        return <PayrollRuns />;
      default:
        return (
          <Panel
            title="This page is not part of the demo"
            description="Choose a page from the navigation to continue exploring."
          >
            <a href="#/employee" className={buttonClass}>
              Go to employee home
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </Panel>
        );
    }
  }
  if (route === "/case" || route === "/technical") {
    return <ReleaseCase mainRef={mainRef} technical={route === "/technical"} />;
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#demo-main"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus({ preventScroll: true });
          window.scrollTo({ top: 0 });
        }}
        className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-lg bg-primary p-3 text-primary-foreground focus:translate-y-0"
      >
        Skip to main content
      </a>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
          <DemoNavigation
            role={role}
            route={route}
            onNavigate={() => undefined}
          />
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-18 items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-8">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open navigation"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg hover:bg-accent lg:hidden"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 gap-0 p-0">
                <SheetTitle className="sr-only">Demo navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Choose a page in your current demo workspace.
                </SheetDescription>
                <DemoNavigation
                  role={role}
                  route={route}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <nav aria-label="Breadcrumb" className="min-w-0 flex-1 text-sm">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <a
                    href={`#${role === "employee" ? "/employee" : "/hr/dashboard"}`}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {roleLabel(role)}
                  </a>
                </li>
                <li aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </li>
                <li aria-current="page" className="font-medium">
                  {labelFor(route)}
                </li>
              </ol>
            </nav>
            <PageFinder role={role} />
          </header>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border bg-card px-5 py-3 sm:px-8">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="mr-2 inline-block rounded border border-primary/20 bg-primary-muted px-2 py-1 font-semibold text-primary">
                INTERACTIVE DEMO
              </span>
              Synthetic data · Changes reset on reload ·{" "}
              <a href="#/case" className="font-semibold text-primary underline">Return to release case</a>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="demo-workspace"
                className="text-xs font-medium text-muted-foreground"
              >
                Demo workspace
              </label>
              <select
                id="demo-workspace"
                value={role}
                onChange={(event) => {
                  goTo(
                    event.target.value === "hr" ? "/hr/dashboard" : "/employee",
                  );
                }}
                className="min-h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium"
              >
                <option value="employee">Employee</option>
                <option value="hr">HR operations</option>
              </select>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Reset demo
              </button>
            </div>
          </div>
          <main
            id="demo-main"
            ref={mainRef}
            tabIndex={-1}
            className="mx-auto max-w-7xl px-5 py-8 outline-none sm:px-8 lg:py-10"
          >
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {role === "employee"
                  ? "Your employee workspace"
                  : "Your HR workspace"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {route === "/employee"
                  ? "Good morning, Alex"
                  : route === "/hr/dashboard"
                    ? "HR overview"
                    : labelFor(route)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {PAGE_DESCRIPTIONS[route] ??
                  "Explore a supported page from the menu."}
              </p>
            </div>
            {announcement ? (
              <p
                role="status"
                className="mb-6 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary-muted p-4 text-sm"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                {announcement}
              </p>
            ) : (
              <div role="status" className="sr-only" />
            )}
            {content()}
            <footer className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
              HR ERP navigation preview · Sample people and figures · No
              account, backend, or real HR actions.
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
