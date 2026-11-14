"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  type AppRole,
  activeNavItem,
  navGroupsForRole,
  roleLabel,
} from "@/lib/navigation/role-nav";

type Props = {
  role: AppRole;
  onNavigate?: () => void;
  className?: string;
};

export function AppSidebar({ role, onNavigate, className }: Props) {
  const pathname = usePathname();
  const active = activeNavItem(role, pathname);

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="shrink-0 border-b border-sidebar-border px-5 py-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          aria-label="HR ERP workspaces"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">HR ERP</span>
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {roleLabel(role)} workspace
        </p>
      </div>
      <nav
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5"
        aria-label={`${roleLabel(role)} navigation`}
      >
        {navGroupsForRole(role).map((group) => (
          <section key={group.label} aria-label={group.label}>
            <h2 className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {group.label}
            </h2>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={
                      active?.href === item.href ? "page" : undefined
                    }
                    className={cn(
                      "flex min-h-10 items-center justify-between gap-2 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      active?.href === item.href
                        ? "border-primary bg-primary-muted font-semibold text-primary"
                        : "border-transparent text-sidebar-foreground hover:bg-accent",
                    )}
                  >
                    <span>{item.label}</span>
                    {active?.href === item.href ? (
                      <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        >
          <LayoutGrid className="size-4" aria-hidden />
          Workspaces
          <ArrowUpRight className="ml-auto size-3.5" aria-hidden />
        </Link>
      </div>
    </aside>
  );
}
