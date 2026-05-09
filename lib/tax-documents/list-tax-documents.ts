import type { TaxDocumentKind } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type TaxDocumentSummaryPayload = {
  id: string;
  taxYear: number;
  documentKind: TaxDocumentKind;
  title: string;
  availabilityNote: string | null;
  issuedAt: string | null;
};

export async function listMyTaxDocumentSummaries(
  auth: AuthContext,
): Promise<TaxDocumentSummaryPayload[]> {
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
      permission: "tax_documents:read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const rows = await tx.taxYearDocument.findMany({
        where: { tenantId: auth.tenantId, employeeId },
        orderBy: [{ taxYear: "desc" }, { createdAt: "desc" }],
        take: 20,
      });

      return rows.map((row) => ({
        id: row.id,
        taxYear: row.taxYear,
        documentKind: row.documentKind,
        title: row.title,
        availabilityNote: row.availabilityNote,
        issuedAt: row.issuedAt ? row.issuedAt.toISOString() : null,
      }));
    },
  );
}
