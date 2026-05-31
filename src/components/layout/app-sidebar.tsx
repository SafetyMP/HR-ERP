"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Target,
  UserRound,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { type AppRole, navForRole, roleLabel } from "@/lib/navigation/role-nav";

type Props = {
  role: AppRole;
  onNavigate?: () => void;
  className?: string;
};

const NAV_ICONS: Record<string, LucideIcon> = {
  "/employee": Home,
  "/employee/paystub": DollarSign,
  "/employee/paystub/history": DollarSign,
  "/employee/time": Clock,
  "/employee/pto": Calendar,
  "/employee/benefits": Heart,
  "/employee/benefits/life-events": Heart,
  "/employee/profile": UserRound,
  "/employee/performance/goals": Target,
  "/employee/performance/reviews": Target,
  "/employee/learning": GraduationCap,
  "/employee/tax-documents": DollarSign,
  "/employee/onboarding": UserRound,
  "/employee/leaving": LogOut,
  "/manager/team-attendance": Users,
  "/manager/team-leave": Calendar,
  "/manager/punch-corrections": Clock,
  "/manager/recruiting": Briefcase,
  "/manager/team-performance": Target,
  "/hr/dashboard": LayoutDashboard,
  "/hr/payroll-runs": DollarSign,
  "/hr/benefits/life-events": Heart,
  "/hr/benefits/election-change-requests": Heart,
  "/hr/review-queue": Users,
  "/hr/onboarding-templates": UserRound,
};

function isActive(pathname: string, href: string, matchPrefix?: string) {
  if (href === "/employee") {
    return pathname === "/employee";
  }
  const prefix = matchPrefix ?? href;
  if (pathname === href) return true;
  if (prefix !== href && pathname.startsWith(prefix)) return true;
  return false;
}

export function AppSidebar({ role, onNavigate, className }: Props) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <aside
      className={cn(
        "flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="border-b border-sidebar-border px-4 py-5">
        <p className="text-lg font-semibold tracking-tight text-foreground">HR ERP</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{roleLabel(role)} workspace</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label={`${roleLabel(role)} navigation`}>
        <ul className="flex flex-col gap-1" role="list">
          {items.map((item) => {
            const active = isActive(pathname, item.href, item.matchPrefix);
            const Icon = NAV_ICONS[item.href];
            return (
              <li key={item.href} className="list-none">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-accent",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3">
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Switch workspace
        </Link>
      </div>
    </aside>
  );
}
