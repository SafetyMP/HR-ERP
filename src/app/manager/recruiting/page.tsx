import type { Metadata } from "next";

import Link from "next/link";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { ManagerRecruitingClient } from "./manager-recruiting-client";

export const metadata: Metadata = {
  title: "Recruiting",
  description: "Open roles and hiring pipeline",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function ManagerRecruitingPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/manager/recruiting");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Hiring
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Open roles</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Create requisitions and move candidates through the pipeline.{" "}
          <Link href="/" className="font-medium text-primary underline underline-offset-4">
            Back to home
          </Link>
          .
        </p>
      </header>
      <ManagerRecruitingClient />
    </div>
  );
}
