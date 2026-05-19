import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type SelfEnrollmentRow = {
  id: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  course: {
    id: string;
    code: string;
    title: string;
    estimatedDuration: string | null;
  };
};

export async function listSelfEnrollments(
  auth: AuthContext,
): Promise<SelfEnrollmentRow[]> {
  const employeeId = auth.subjectEmployeeId ?? auth.subjectId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  const rows = await withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "learning:enrollment_self_read",
      resourceClassification: "internal",
    },
    async (tx) =>
      tx.learningEnrollment.findMany({
        where: { tenantId: auth.tenantId, employeeId },
        orderBy: [{ dueAt: "asc" }, { assignedAt: "desc" }],
        take: 100,
        include: {
          course: {
            select: {
              id: true,
              code: true,
              title: true,
              estimatedDuration: true,
            },
          },
        },
      }),
  );

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    dueAt: r.dueAt?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
    course: r.course,
  }));
}
