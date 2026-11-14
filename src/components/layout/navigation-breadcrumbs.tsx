"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  activeNavItem,
  navForRole,
  roleLabel,
  type AppRole,
} from "@/lib/navigation/role-nav";

export function NavigationBreadcrumbs({ role }: { role: AppRole }) {
  const pathname = usePathname().replace(/\/+$/, "");
  const active = activeNavItem(role, pathname);
  const home = navForRole(role)[0];
  const isDetail = active && pathname !== active.href;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0 text-sm">
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5">
        <li>
          <Link
            href={home?.href ?? "/"}
            className="rounded text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {roleLabel(role)}
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="size-3 text-muted-foreground" />
        </li>
        <li className="min-w-0 font-medium">
          {isDetail ? (
            <Link
              className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              href={active.href}
            >
              {active.label}
            </Link>
          ) : (
            <span aria-current="page">{active?.label ?? "Workspace"}</span>
          )}
        </li>
        {isDetail ? (
          <>
            <li aria-hidden>
              <ChevronRight className="size-3 text-muted-foreground" />
            </li>
            <li>
              <span aria-current="page" className="text-muted-foreground">
                Details
              </span>
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
