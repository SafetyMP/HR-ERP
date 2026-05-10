import { ApiError } from "@/lib/api/v1/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export interface CreateCourseInput {
  code: string;
  title: string;
  description?: string | null;
  mandatoryDueDays?: number | null;
  estimatedDuration?: string | null;
  externalProvider?: string | null;
  externalContentRef?: string | null;
}

export async function createCourse(auth: AuthContext, input: CreateCourseInput) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "learning:catalog_write",
      resourceClassification: "internal",
    },
    async (tx) =>
      tx.learningCourse.create({
        data: {
          tenantId: auth.tenantId,
          code: input.code.trim(),
          title: input.title.trim(),
          description: input.description ?? null,
          mandatoryDueDays: input.mandatoryDueDays ?? null,
          estimatedDuration: input.estimatedDuration ?? null,
          externalProvider: input.externalProvider ?? null,
          externalContentRef: input.externalContentRef ?? null,
          status: "DRAFT",
        },
      }),
  );
}

export interface AssignCourseInput {
  courseId: string;
  employeeIds: string[];
}

/**
 * Assign a published course to one or more employees. Idempotent on the
 * (tenantId, courseId, employeeId) tuple — re-assigning a completed enrollment
 * is a no-op. `dueAt` is computed from `mandatoryDueDays` at assignment time.
 */
export async function assignCourse(auth: AuthContext, input: AssignCourseInput) {
  if (input.employeeIds.length === 0) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "employeeIds must not be empty",
    });
  }
  if (input.employeeIds.length > 500) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "employeeIds capped at 500 per call",
    });
  }
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "learning:enrollment_assign",
      resourceClassification: "internal",
    },
    async (tx) => {
      const course = await tx.learningCourse.findFirst({
        where: { id: input.courseId, tenantId: auth.tenantId },
      });
      if (!course) {
        throw new ApiError(404, {
          code: "not_found",
          message: "learning_course_not_found",
        });
      }
      if (course.status !== "PUBLISHED") {
        throw new ApiError(409, {
          code: "course_not_published",
          message: `cannot assign course in status ${course.status}`,
        });
      }
      const dueAt = course.mandatoryDueDays
        ? new Date(Date.now() + course.mandatoryDueDays * 86_400_000)
        : null;

      let assigned = 0;
      for (const employeeId of input.employeeIds) {
        const result = await tx.learningEnrollment.upsert({
          where: {
            tenantId_courseId_employeeId: {
              tenantId: auth.tenantId,
              courseId: course.id,
              employeeId,
            },
          },
          update: {},
          create: {
            tenantId: auth.tenantId,
            courseId: course.id,
            employeeId,
            status: "ASSIGNED",
            dueAt,
          },
        });
        if (result.status === "ASSIGNED") assigned += 1;
      }

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.core_hr",
        eventType: "learning.course.assigned",
        correlationId: auth.correlationId,
        payload: {
          courseId: course.id,
          assigned,
          employeeCount: input.employeeIds.length,
        },
      });

      return { courseId: course.id, assigned };
    },
  );
}

export async function completeSelfEnrollment(
  auth: AuthContext,
  enrollmentId: string,
  scoreBp?: number,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "learning:enrollment_complete_self",
      resourceClassification: "internal",
    },
    async (tx) => {
      const enrollment = await tx.learningEnrollment.findFirst({
        where: { id: enrollmentId, tenantId: auth.tenantId },
      });
      if (!enrollment) {
        throw new ApiError(404, {
          code: "not_found",
          message: "learning_enrollment_not_found",
        });
      }
      if (enrollment.employeeId !== auth.subjectId) {
        throw new ApiError(403, {
          code: "forbidden",
          message: "self-completion must target own enrollment",
        });
      }
      if (
        enrollment.status === "COMPLETED" ||
        enrollment.status === "WAIVED" ||
        enrollment.status === "EXPIRED"
      ) {
        throw new ApiError(409, {
          code: "enrollment_terminal",
          message: `enrollment already ${enrollment.status.toLowerCase()}`,
        });
      }

      const updated = await tx.learningEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          scoreBp: scoreBp ?? null,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.core_hr",
        eventType: "learning.enrollment.completed",
        correlationId: auth.correlationId,
        payload: {
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          employeeId: enrollment.employeeId,
        },
      });

      return updated;
    },
  );
}
