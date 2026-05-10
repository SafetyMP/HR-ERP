import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-background text-foreground antialiased selection:bg-primary/25 selection:text-foreground">
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-6">
          <ButtonLink href="/">← Home</ButtonLink>
          <nav aria-label="Demo section" className="flex flex-wrap gap-4 text-sm">
            <NavAnchor href="/demo/capabilities#main-content">Capabilities hub</NavAnchor>
            <a
              href="https://github.com/SafetyMP/HR-ERP/blob/main/contracts/openapi/core-hr-v1.yaml"
              className="font-medium text-primary underline underline-offset-4 hover:brightness-110"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenAPI
            </a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

function ButtonLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80"
    >
      {children}
    </Link>
  );
}

function NavAnchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-primary underline underline-offset-4 hover:brightness-110">
      {children}
    </Link>
  );
}
