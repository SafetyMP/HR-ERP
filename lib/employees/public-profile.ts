import { ApiError } from "@/lib/api/v1/errors";
import {
  getEmployeeClosed,
  type EmployeeClosed,
} from "@/lib/core-hr/employees";
import { getRedis } from "@/lib/redis";
import type { AuthContext } from "@/lib/security/auth-context";
import {
  assertEmployeeRecordReadable,
  assertPermission,
  assertTenantScopedSubject,
} from "@/lib/security/policy-engine";

const EMPLOYEE_CACHE_PREFIX = "hrerp:v1:employee:";
const EMPLOYEE_CACHE_TTL_SEC = 30;

export async function invalidateEmployeePublicProfileCache(
  tenantId: string,
  employeeId: string,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`${EMPLOYEE_CACHE_PREFIX}${tenantId}:${employeeId}`);
}

/** Closed Core HR employee read projection (ADR 0023). */
export type EmployeePublicPayload = {
  employee: EmployeeClosed;
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

  const employee = await getEmployeeClosed(auth, employeeId);
  const payload: EmployeePublicPayload = { employee };

  if (redis) {
    await redis.set(cacheKey, JSON.stringify(payload), "EX", EMPLOYEE_CACHE_TTL_SEC);
  }

  return payload;
}
