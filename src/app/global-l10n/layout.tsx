import Link from "next/link";

import type { ReactNode } from "react";

import { bootstrapGlobalL10nDemo } from "@/lib/l10n/seed-demo";

export const dynamic = "force-dynamic";

export default async function GlobalL10nLayout({
  children,
}: {
  children: ReactNode;
}) {
  await bootstrapGlobalL10nDemo();

  const links = [
    { href: "/global-l10n/profile", label: "Employee profile & naming" },
    { href: "/global-l10n/scheduling", label: "Async scheduling overlap" },
    { href: "/global-l10n/payroll/splits", label: "Multi-currency payouts" },
    { href: "/global-l10n/planning/sprint", label: "Sprint capacity matrix" },
  ];

  return (
    <div className="flex min-h-[70vh] w-full gap-10 px-8 py-10">
      <nav className="w-72 shrink-0 space-y-2 border-r border-zinc-200 pr-6 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Global ops
        </p>
        {links.map((l) => (
          <Link
            key={l.href}
            className="block rounded px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
            href={l.href}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="max-w-3xl flex-1 space-y-6">{children}</div>
    </div>
  );
}
