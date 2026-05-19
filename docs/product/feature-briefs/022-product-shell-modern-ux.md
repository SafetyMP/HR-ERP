# Feature brief: Product shell and modern UX

**ID:** 022-product-shell-modern-ux  
**Status:** PO approved  
**Last updated:** 2026-05-18  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Active employee, hiring manager, and HR/payroll admin using the same product daily—not demo visitors clicking a link farm. |
| **Job-to-be-done** | Complete pay, time, leave, benefits, hiring, and payroll-close tasks with **persistent navigation**, **clear feedback**, and **scannable** screens—without hunting links on the home page or parsing dev-style UUID fields. |
| **Pain today** | Each route reinvents headers and styles (`zinc-*` vs tokens); no sidebar; success/errors as inline `msg` text; payroll/recruiting flows feel like internal tools. |
| **Outcome** | Buyer demo shows one cohesive mid-market HR product: ≤2 clicks to current paystub from shell (W1); HR payroll close without UUID copy-paste; consistent loading/empty/error patterns. |
| **Scope boundary** | No `/examples/*`, `/analytics/*`, `/global-l10n/*` shell; no Figma resync; no backend/API changes; dev JWT remains behind developer tools in dev only. |

---

## Empathy / process

Employees open the app under time pressure—pay anxiety, PTO before a trip, benefits after a life event. Managers and HR admins juggle queues. If navigation changes per page or errors look like debug output, trust drops and support tickets rise. The shell must feel **stable, calm, and intentional** on every visit.

---

## Personas & scenarios

1. **Given** a signed-in employee **When** they open any `/employee/*` route **Then** they see the same sidebar (or mobile menu) with Pay, Time, PTO, and Benefits reachable without returning to home.
2. **Given** a signed-out visitor **When** they land on `/` **Then** they see a concise sign-in path—not a wall of demo buttons.
3. **Given** an HR admin resolving payroll **When** they complete an action **Then** they get toast confirmation and updated data without hunting for a `msg` paragraph.
4. **Given** keyboard-only use **When** tabbing through the shell **Then** skip link, sidebar links, and focus rings remain visible.

---

## Prioritization rationale

Phase B delivered APIs and functional UI; buyer feedback requires **product-grade presentation** before Phase C integrations. This brief is cross-cutting infrastructure for all Track A/B routes.

---

## User acceptance criteria (UAC)

1. Employee routes render inside a shared **app shell** with persistent navigation to paystub, time, PTO, and benefits.
2. Manager routes render inside a shared app shell with navigation to team attendance, recruiting, and team performance.
3. HR routes render inside a shared app shell with navigation to dashboard, pay runs, life events, and review queue.
4. The home page (`/`) shows sign-in for anonymous users and **quick actions** (or redirect) for authenticated users—not a full link farm.
5. Primary mutations (payroll run, life event submit, interview schedule) surface **toast** success or error feedback via Sonner.
6. Nested HR/manager routes show **breadcrumbs** back to parent list views where applicable.
7. Product routes use design tokens (`text-muted-foreground`, `border-border`, `bg-card`)—no `zinc-*` on migrated employee ESS pages.
8. Paystub remains reachable from the employee shell in **≤2 clicks** from first load after sign-in (friction check).

---

## Friction checks

- **Task-time target:** Current paystub ≤10s from employee shell landing (brief 001 alignment).
- **Empty / no data state:** Shared `EmptyState` component with title, explanation, and optional CTA.
- **Errors:** Toast + retry affordance; no raw API codes in primary UI.

---

## Notes for Frontend

- TanStack Query wrappers for server state; Zustand only for ephemeral UI.
- `HrPageShell` nav deprecated in favor of `hr/layout` sidebar—keep thin compatibility wrapper if needed during migration.
