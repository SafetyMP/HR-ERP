import type { Metadata } from "next";

import Link from "next/link";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { RequisitionPipelineClient } from "./requisition-pipeline-client";

export const metadata: Metadata = {
  title: "Applicant pipeline",
  description: "Candidates for a job requisition",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function RequisitionPipelinePage(props: Props) {
  const { id } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(
    sp.devJwt,
    `/manager/recruiting/requisitions/${id}`,
  );

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Hiring
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Applicant pipeline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/manager/recruiting" className="font-medium text-primary underline underline-offset-4">
            All open roles
          </Link>
        </p>
      </header>
      <RequisitionPipelineClient requisitionId={id} />
    </div>
  );
}
