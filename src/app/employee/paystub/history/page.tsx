import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { PaystubHistoryClient } from "./paystub-history-client";

export const metadata: Metadata = {
  title: "Pay history",
  description: "Past finalized earnings summaries",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function PaystubHistoryPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/paystub/history");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pay</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Pay history</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Summaries of finalized pay periods (gross and net). Open your current statement for full line detail.
        </p>
      </header>
      <PaystubHistoryClient />
    </div>
  );
}
