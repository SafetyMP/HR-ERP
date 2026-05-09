import { Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type ClockInResponse = {
  punch: {
    id: string;
    employeeId: string;
    kind: "CLOCK_IN";
    occurredAt: string;
    idempotentReplay: boolean;
  };
};

/**
 * Self-service clock-in: server clock, Serializable txn, idempotent via `(tenantId, idempotencyKey)`.
 */
export async function clockInSelf(
  auth: AuthContext,
  idempotencyKey: string,
): Promise<ClockInResponse> {
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
        if (existing.kind !== "CLOCK_IN") {
          throw new ApiError(409, {
            code: "conflict",
            message: "idempotency_key_kind_mismatch",
          });
        }
        return {
          punch: {
            id: existing.id,
            employeeId: existing.employeeId,
            kind: "CLOCK_IN" as const,
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

      const lastOpen = await tx.attendancePunch.findFirst({
        where: { employeeId: employee.id },
        orderBy: { occurredAt: "desc" },
      });

      if (lastOpen?.kind === "CLOCK_IN") {
        throw new ApiError(409, {
          code: "conflict",
          message: "already_clocked_in",
        });
      }

      let row;
      try {
        row = await tx.attendancePunch.create({
          data: {
            tenantId: employee.tenantId,
            employeeId: employee.id,
            kind: "CLOCK_IN",
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
            replay.kind === "CLOCK_IN"
          ) {
            return {
              punch: {
                id: replay.id,
                employeeId: replay.employeeId,
                kind: "CLOCK_IN" as const,
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
          kind: "CLOCK_IN" as const,
          occurredAt: row.occurredAt.toISOString(),
          idempotentReplay: false,
        },
      };
    },
  );
}
