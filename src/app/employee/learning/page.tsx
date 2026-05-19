import type { Metadata } from "next";

import Link from "next/link";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { EmployeeLearningClient } from "./employee-learning-client";

export const metadata: Metadata = {
  title: "My learning",
  description: "View and complete assigned learning",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeeLearningPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/learning");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Learning
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">My learning</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Assigned courses and completion status.{" "}
          <Link href="/" className="font-medium text-primary underline underline-offset-4">
            Back to home
          </Link>
          .
        </p>
      </header>
      <EmployeeLearningClient />
    </div>
  );
}
