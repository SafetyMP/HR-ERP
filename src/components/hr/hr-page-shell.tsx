"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/hr/dashboard", label: "Dashboard" },
  { href: "/hr/payroll-runs", label: "Pay runs" },
  { href: "/hr/benefits/life-events", label: "Life events" },
  { href: "/hr/review-queue", label: "Review queue" },
] as const;

type Props = {
  children: ReactNode;
  activePath?: string;
  onReload?: () => void;
  onSignOut?: () => void;
  className?: string;
};

export function HrPageShell({
  children,
  activePath,
  onReload,
  onSignOut,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <nav
        aria-label="HR operations"
        className="flex flex-wrap items-center gap-2 border-b border-border pb-4"
      >
        {NAV_LINKS.map((link) => {
          const active =
            activePath === link.href ||
            (link.href !== "/hr/dashboard" && activePath?.startsWith(link.href));
          return (
            <Button
              key={link.href}
              asChild
              variant={active ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          );
        })}
        <span className="flex-1" />
        {onReload ? (
          <Button type="button" variant="outline" size="sm" onClick={onReload}>
            Reload
          </Button>
        ) : null}
        {onSignOut ? (
          <Button type="button" variant="ghost" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        ) : null}
      </nav>
      {children}
    </div>
  );
}
