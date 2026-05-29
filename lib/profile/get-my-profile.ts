import { ApiError } from "@/lib/api/v1/errors";
import {
  buildMyProfileEnvelope,
  mapEmployeeRowToSelfProfile,
  type MyProfileEnvelope,
} from "@/lib/profile/employee-self-profile-mapper";
import { prisma } from "@/lib/prisma";
import type { AbacConstraints } from "@/lib/security/abac-attributes";
import type { Permission } from "@/lib/security/permissions";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function getMyProfile(
  auth: AuthContext,
  policy?: { permission: Permission; abac?: AbacConstraints },
): Promise<MyProfileEnvelope> {
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
      permission: policy?.permission ?? "employees:read",
      abac:
        policy?.abac ?? {
          minMfa: "standard",
          maxDataClassification: "confidential",
        },
    },
    async (tx) => {
      const row = await tx.employee.findFirst({
        where: { id: employeeId, tenantId: auth.tenantId },
      });

      if (!row) {
        throw new ApiError(404, {
          code: "not_found",
          message: "employee_not_found",
        });
      }

      const profile = mapEmployeeRowToSelfProfile(row);
      return buildMyProfileEnvelope(profile);
    },
  );
}
