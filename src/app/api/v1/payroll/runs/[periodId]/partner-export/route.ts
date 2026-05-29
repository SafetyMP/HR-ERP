import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import {
  getPayrollPartnerExportStatus,
  triggerPayrollPartnerExport,
} from "@/lib/payroll/partner-export-service";

export const POST = defineV1Route({
  method: "POST",
  pathname: "/api/v1/payroll/runs/:periodId/partner-export",
  classification: "confidential",
  handler: async ({ auth, request }) => {
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/payroll\/runs\/([^/]+)\/partner-export$/);
    const periodId = match?.[1];
    if (!periodId) {
      throw new Error("period_id_missing");
    }
    const result = await triggerPayrollPartnerExport(auth, periodId);
    return { export: result };
  },
});

export const GET = defineV1Route({
  method: "GET",
  pathname: "/api/v1/payroll/runs/:periodId/partner-export",
  classification: "confidential",
  handler: async ({ auth, request }) => {
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/payroll\/runs\/([^/]+)\/partner-export$/);
    const periodId = match?.[1];
    if (!periodId) {
      throw new Error("period_id_missing");
    }
    const exports = await getPayrollPartnerExportStatus(auth, periodId);
    return { exports };
  },
});
