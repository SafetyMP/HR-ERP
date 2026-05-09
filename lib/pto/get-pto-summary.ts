import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type RecordedTimeOffRow = {
  requestDate: string;
};

export type PtoSummaryPayload = {
  balanceHours: number | null;
  balanceAsOfDate: string | null;
  recentTimeOff: RecordedTimeOffRow[];
};

function decimalToNumber(d: { toString(): string }): number {
  return Number(d.toString());
}

export async function getPtoSummary(auth: AuthContext): Promise<PtoSummaryPayload> {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "pto:self_read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const employeeScoped = await tx.employee.findFirst({
        where: { id: employeeId, tenantId: auth.tenantId },
        select: { id: true },
      });

      if (!employeeScoped) {
        throw new ApiError(404, {
          code: "not_found",
          message: "employee_not_found",
        });
      }

      const balanceRow = await tx.ptoBalance.findFirst({
        where: { employeeId },
        orderBy: [{ asOfDate: "desc" }, { id: "desc" }],
      });

      const requests = await tx.ptoRequest.findMany({
        where: { tenantId: auth.tenantId, employeeId },
        orderBy: [{ requestDate: "desc" }, { id: "desc" }],
        take: 120,
        select: { requestDate: true },
      });

      const balanceHours = balanceRow ? decimalToNumber(balanceRow.balanceHours) : null;
      const balanceAsOfDate = balanceRow ? balanceRow.asOfDate.toISOString().slice(0, 10) : null;

      const recentTimeOff: RecordedTimeOffRow[] = requests.map((r) => ({
        requestDate: r.requestDate.toISOString().slice(0, 10),
      }));

      return {
        balanceHours,
        balanceAsOfDate,
        recentTimeOff,
      };
    },
  );
}
