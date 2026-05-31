import { Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { findLatestAttendancePunch, isOpenShift } from "@/lib/attendance/open-shift";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type ClockOutResponse = {
  punch: {
    id: string;
    employeeId: string;
    kind: "CLOCK_OUT";
    occurredAt: string;
    idempotentReplay: boolean;
  };
};

/**
 * Self-service clock-out: server clock, Serializable txn, idempotent via `(tenantId, idempotencyKey)`.
 */
export async function clockOutSelf(
  auth: AuthContext,
  idempotencyKey: string,
): Promise<ClockOutResponse> {
  if (!auth.subjectEmployeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "principal_missing_employee_link",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "attendance:clock",
      prismaTx: {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10_000,
      },
    },
    async (tx) => {
      const existing = await tx.attendancePunch.findUnique({
        where: {
          tenantId_idempotencyKey: {
            tenantId: auth.tenantId,
            idempotencyKey,
          },
        },
      });

      if (existing) {
        if (existing.employeeId !== auth.subjectEmployeeId) {
          throw new ApiError(403, {
            code: "forbidden",
            message: "idempotency_key_scope_mismatch",
          });
        }
        if (existing.kind !== "CLOCK_OUT") {
          throw new ApiError(409, {
            code: "conflict",
            message: "idempotency_key_kind_mismatch",
          });
        }
        return {
          punch: {
            id: existing.id,
            employeeId: existing.employeeId,
            kind: "CLOCK_OUT" as const,
            occurredAt: existing.occurredAt.toISOString(),
            idempotentReplay: true,
          },
        };
      }

      const employee = await tx.employee.findFirst({
        where: { id: auth.subjectEmployeeId },
      });

      if (!employee) {
        throw new ApiError(403, {
          code: "forbidden",
          message: "employee_not_found_for_principal",
        });
      }

      const latest = await findLatestAttendancePunch(tx, auth.tenantId, employee.id);

      if (!isOpenShift(latest)) {
        throw new ApiError(409, {
          code: "conflict",
          message: "not_clocked_in",
        });
      }

      let row;
      try {
        row = await tx.attendancePunch.create({
          data: {
            tenantId: employee.tenantId,
            employeeId: employee.id,
            kind: "CLOCK_OUT",
            occurredAt: new Date(),
            source: "api_v1",
            idempotencyKey,
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          const replay = await tx.attendancePunch.findUnique({
            where: {
              tenantId_idempotencyKey: {
                tenantId: auth.tenantId,
                idempotencyKey,
              },
            },
          });
          if (
            replay &&
            replay.employeeId === auth.subjectEmployeeId &&
            replay.kind === "CLOCK_OUT"
          ) {
            return {
              punch: {
                id: replay.id,
                employeeId: replay.employeeId,
                kind: "CLOCK_OUT" as const,
                occurredAt: replay.occurredAt.toISOString(),
                idempotentReplay: true,
              },
            };
          }
          throw new ApiError(409, {
            code: "conflict",
            message: "write_conflict",
          });
        }
        throw err;
      }

      return {
        punch: {
          id: row.id,
          employeeId: row.employeeId,
          kind: "CLOCK_OUT" as const,
          occurredAt: row.occurredAt.toISOString(),
          idempotentReplay: false,
        },
      };
    },
  );
}
