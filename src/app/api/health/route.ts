import { NextResponse } from "next/server";

import { integrationMetricSnapshot } from "@/lib/integrations/metrics";

/**
 * Liveness probe for Docker/orchestrators. Unauthenticated by design
 * (outside `/api/v1/*` middleware matcher).
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "hr-erp",
      time: new Date().toISOString(),
      integrationMetrics: integrationMetricSnapshot(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
