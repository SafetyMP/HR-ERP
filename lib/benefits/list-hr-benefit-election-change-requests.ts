import type { BenefitCategory } from "@/app/generated/prisma/client";

import { benefitCategoryDisplayLabel } from "@/lib/benefits/category-display-label";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type HrBenefitElectionChangeRequestRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  category: BenefitCategory;
  categoryLabel: string;
  summary: string;
  status: string;
  createdAt: string;
};

export async function listHrBenefitElectionChangeRequests(
  auth: AuthContext,
): Promise<HrBenefitElectionChangeRequestRow[]> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "case:hr_triage",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const rows = await tx.benefitElectionChangeRequest.findMany({
        where: {
          tenantId: auth.tenantId,
          status: "SUBMITTED",
        },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        employeeId: row.employeeId,
        employeeName: `${row.employee.firstName} ${row.employee.lastName}`.trim(),
        category: row.category,
        categoryLabel: benefitCategoryDisplayLabel(row.category),
        summary: row.summary,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      }));
    },
  );
}
