import Link from "next/link";

import { HomeLandingClient } from "./home-landing-client";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <HomeLandingClient />
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-6 py-6 text-sm text-muted-foreground">
          <span>Developers:</span>
          <Button asChild variant="ghost" size="sm">
            <Link href="/demo/capabilities">Capability hub</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/examples/jurisdiction">Examples</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/qa-lab">QA lab</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/analytics/churn">Analytics</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
