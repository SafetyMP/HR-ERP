import type { Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { updateEmployeeInTx } from "@/lib/core-hr/writes";
import {
  buildMyProfileEnvelope,
  mapEmployeeRowToSelfProfile,
  type MyProfileEnvelope,
} from "@/lib/profile/employee-self-profile-mapper";
import type { PatchMyProfileInput } from "@/lib/profile/patch-my-profile-schema";
import { prisma } from "@/lib/prisma";
import { invalidateEmployeePublicProfileCache } from "@/lib/employees/public-profile";
import type { AbacConstraints } from "@/lib/security/abac-attributes";
import type { Permission } from "@/lib/security/permissions";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

function patchToPrismaData(patch: PatchMyProfileInput): Prisma.EmployeeUpdateInput {
  const data: Prisma.EmployeeUpdateInput = {};

  if (patch.preferredName !== undefined) data.preferredName = patch.preferredName;
  if (patch.personalEmail !== undefined) data.personalEmail = patch.personalEmail;
  if (patch.phone !== undefined) data.phone = patch.phone;

  if (patch.mailingAddressLine1 !== undefined) data.mailingAddressLine1 = patch.mailingAddressLine1;
  if (patch.mailingAddressLine2 !== undefined) data.mailingAddressLine2 = patch.mailingAddressLine2;
  if (patch.mailingCity !== undefined) data.mailingCity = patch.mailingCity;
  if (patch.mailingRegion !== undefined) data.mailingRegion = patch.mailingRegion;
  if (patch.mailingPostalCode !== undefined) data.mailingPostalCode = patch.mailingPostalCode;
  if (patch.mailingCountry !== undefined) data.mailingCountry = patch.mailingCountry;

  if (patch.emergencyContactName !== undefined) data.emergencyContactName = patch.emergencyContactName;
  if (patch.emergencyContactPhone !== undefined) data.emergencyContactPhone = patch.emergencyContactPhone;
  if (patch.emergencyContactRelationship !== undefined) {
    data.emergencyContactRelationship = patch.emergencyContactRelationship;
  }

  return data;
}

function countExplicitPatchKeys(patch: PatchMyProfileInput): number {
  return Object.keys(patch).filter((k) => patch[k as keyof PatchMyProfileInput] !== undefined).length;
}

export type PatchMyProfileResult = MyProfileEnvelope & {
  confirmationMessage: string;
};

export async function patchMyProfile(
  auth: AuthContext,
  patch: PatchMyProfileInput,
  policy?: { permission: Permission; abac?: AbacConstraints },
): Promise<PatchMyProfileResult> {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  if (countExplicitPatchKeys(patch) === 0) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "no_profile_updates_provided",
    });
  }

  const data = patchToPrismaData(patch);
  if (Object.keys(data).length === 0) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "no_profile_updates_provided",
    });
  }

  const envelope = await withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: policy?.permission ?? "profile:self_update",
      abac:
        policy?.abac ?? {
          minMfa: "standard",
          maxDataClassification: "confidential",
        },
    },
    async (tx) => {
      const existing = await tx.employee.findFirst({
        where: { id: employeeId, tenantId: auth.tenantId },
      });

      if (!existing) {
        throw new ApiError(404, {
          code: "not_found",
          message: "employee_not_found",
        });
      }

      const updated = await updateEmployeeInTx(tx, employeeId, data);

      const profile = mapEmployeeRowToSelfProfile(updated);
      return buildMyProfileEnvelope(profile);
    },
  );

  await invalidateEmployeePublicProfileCache(auth.tenantId, employeeId);

  return {
    ...envelope,
    confirmationMessage: "Your profile updates were saved.",
  };
}
