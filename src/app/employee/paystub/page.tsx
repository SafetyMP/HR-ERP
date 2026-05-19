import type { Metadata } from "next";

import Link from "next/link";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { PaystubClient } from "./paystub-client";

export const metadata: Metadata = {
  title: "Earnings statement",
  description: "View your current paystub",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeePaystubPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/paystub");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Pay</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">Earnings statement</h1>
        <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          Your latest finalized paystub for this pay period. Need older periods?{" "}
          <Link href="/employee/paystub/history" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            View pay history
          </Link>
          .
        </p>
      </header>
      <PaystubClient />
    </div>
  );
}
