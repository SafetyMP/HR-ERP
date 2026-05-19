"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { type AppRole, navForRole, roleLabel } from "@/lib/navigation/role-nav";

type Props = {
  role: AppRole;
  onNavigate?: () => void;
  className?: string;
};

function isActive(pathname: string, href: string, matchPrefix?: string) {
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
        "flex h-full w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="border-b border-sidebar-border px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          HR ERP
        </p>
        <p className="mt-1 text-sm font-semibold">{roleLabel(role)}</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label={`${roleLabel(role)} navigation`}>
        <ul className="flex flex-col gap-0.5" role="list">
          {items.map((item) => {
            const active = isActive(pathname, item.href, item.matchPrefix);
            return (
              <li key={item.href} className="list-none">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-accent",
                  )}
                  aria-current={active ? "page" : undefined}
                >
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
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          Home
        </Link>
      </div>
    </aside>
  );
}
