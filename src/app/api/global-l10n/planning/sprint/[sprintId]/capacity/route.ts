import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/v1/errors";
import {
  DemoApiNotAvailableError,
  demoApiNotAvailableResponse,
} from "@/lib/api/non-production-route";
import { requireGlobalL10nApiAuth } from "@/lib/l10n/global-l10n-api-auth";
import { summarizeSprintCapacityForTenant } from "@/lib/holidays/sprint-capacity";
import { prisma } from "@/lib/prisma";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function GET(
  request: Request,
  context: { params: Promise<{ sprintId: string }> },
): Promise<Response> {
  try {
    const auth = await requireGlobalL10nApiAuth(request);
    const { sprintId } = await context.params;

    const rows = await withAuthorizedTransaction(
      prisma,
      auth,
      { permission: "employees:list", resourceClassification: "internal" },
      async (tx) => summarizeSprintCapacityForTenant(tx, sprintId),
    );

    return NextResponse.json({ sprintId, rows });
  } catch (e: unknown) {
    if (e instanceof DemoApiNotAvailableError) {
      return demoApiNotAvailableResponse("global_l10n");
    }
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.payload.message }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : "capacity_read_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
