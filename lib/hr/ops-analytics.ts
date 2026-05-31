import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type HrOpsSummary = {
  headcountActive: number;
  headcountByDepartment: { departmentId: string | null; count: number }[];
  openRequisitions: number;
  medianTimeToHireDays: number | null;
  openPayrollExceptions: number;
  periodsAwaitingLock: number;
  openLifeEvents: number;
  pendingElectionIntents: number;
};

export async function getHrOpsSummary(auth: AuthContext): Promise<HrOpsSummary> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "case:hr_triage",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const tenantId = auth.tenantId;

      const headcountActive = await tx.employee.count({
        where: { tenantId, status: "ACTIVE", deletedAt: null },
      });

      const byDept = await tx.employee.groupBy({
        by: ["departmentId"],
        where: { tenantId, status: "ACTIVE", deletedAt: null },
        _count: { _all: true },
      });

      const openRequisitions = await tx.jobRequisition.count({
        where: { tenantId, status: "OPEN" },
      });

      const hires = await tx.jobApplication.findMany({
        where: {
          tenantId,
          hiredAt: { not: null },
        },
        select: { appliedAt: true, hiredAt: true },
        take: 500,
        orderBy: { hiredAt: "desc" },
      });

      const hireDays = hires
        .filter((h) => h.hiredAt)
        .map((h) => {
          const ms = h.hiredAt!.getTime() - h.appliedAt.getTime();
          return Math.max(0, Math.round(ms / 86_400_000));
        })
        .sort((a, b) => a - b);

      let medianTimeToHireDays: number | null = null;
      if (hireDays.length > 0) {
        const mid = Math.floor(hireDays.length / 2);
        medianTimeToHireDays =
          hireDays.length % 2 === 0
            ? Math.round((hireDays[mid - 1]! + hireDays[mid]!) / 2)
            : hireDays[mid]!;
      }

      const openPayrollExceptions = await tx.payrollRunException.count({
        where: { tenantId, status: "OPEN" },
      });

      const periodsAwaitingLock = await tx.payrollPeriod.count({
        where: { tenantId, status: "COMPUTED" },
      });

      const openLifeEvents = await tx.benefitLifeEvent.count({
        where: {
          tenantId,
          status: { in: ["SUBMITTED", "HR_REVIEW"] },
        },
      });

      const pendingElectionIntents = await tx.benefitElectionChangeRequest.count({
        where: {
          tenantId,
          status: "SUBMITTED",
        },
      });

      return {
        headcountActive,
        headcountByDepartment: byDept.map((d) => ({
          departmentId: d.departmentId,
          count: d._count._all,
        })),
        openRequisitions,
        medianTimeToHireDays,
        openPayrollExceptions,
        periodsAwaitingLock,
        openLifeEvents,
        pendingElectionIntents,
      };
    },
  );
}
