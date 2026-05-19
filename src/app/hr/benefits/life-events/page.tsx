import type { Metadata } from "next";

import Link from "next/link";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { HrLifeEventsClient } from "./hr-life-events-client";

export const metadata: Metadata = {
  title: "Life event queue",
  description: "HR review of benefits life events",
};

type Props = { searchParams?: Promise<{ devJwt?: string }> };

export default async function HrLifeEventsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/hr/benefits/life-events");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          HR · Benefits
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Life event queue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/" className="text-primary underline">
            Home
          </Link>
        </p>
      </header>
      <HrLifeEventsClient />
    </div>
  );
}
