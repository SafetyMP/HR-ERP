import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import {
  assertEmployeeRecordReadable,
  assertPermission,
  assertTenantScopedSubject,
} from "@/lib/security/policy-engine";
import { getRedis } from "@/lib/redis";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

const EMPLOYEE_CACHE_PREFIX = "hrerp:v1:employee:";
const EMPLOYEE_CACHE_TTL_SEC = 30;

export type EmployeePublicPayload = {
  employee: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
  };
};

export async function getEmployeePublicProfile(
  auth: AuthContext,
  employeeId: string,
): Promise<EmployeePublicPayload> {
  assertTenantScopedSubject(auth);
  assertPermission(auth, "employees:read");
  assertEmployeeRecordReadable(auth, employeeId);

  const redis = getRedis();
  const cacheKey = `${EMPLOYEE_CACHE_PREFIX}${auth.tenantId}:${employeeId}`;

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as EmployeePublicPayload;
      } catch {
        await redis.del(cacheKey);
      }
    }
  }

  const row = await withAuthorizedTransaction(
    prisma,
    auth,
    { permission: "employees:read" },
    async (tx) => {
      return tx.employee.findFirst({
        where: { id: employeeId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      });
    },
  );

  if (!row) {
    throw new ApiError(404, {
      code: "not_found",
      message: "employee_not_found",
    });
  }

  const payload: EmployeePublicPayload = {
    employee: {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      createdAt: row.createdAt.toISOString(),
    },
  };

  if (redis) {
    await redis.set(cacheKey, JSON.stringify(payload), "EX", EMPLOYEE_CACHE_TTL_SEC);
  }

  return payload;
}
