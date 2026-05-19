import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function listMyPerformanceReviews(auth: AuthContext) {
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
      permission: "performance:review_self_write",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const openCycle = await tx.performanceCycle.findFirst({
        where: { tenantId: auth.tenantId, status: "OPEN" },
        orderBy: { startDate: "desc" },
      });
      if (!openCycle) return { cycle: null, reviews: [] };

      let review = await tx.performanceReviewV2.findFirst({
        where: {
          tenantId: auth.tenantId,
          cycleId: openCycle.id,
          employeeId,
        },
      });
      if (!review) {
        review = await tx.performanceReviewV2.create({
          data: {
            tenantId: auth.tenantId,
            cycleId: openCycle.id,
            employeeId,
            status: "DRAFT",
          },
        });
      }

      return {
        cycle: {
          id: openCycle.id,
          name: openCycle.name,
          startDate: openCycle.startDate.toISOString().slice(0, 10),
          endDate: openCycle.endDate.toISOString().slice(0, 10),
          ratingScaleMax: openCycle.ratingScaleMax,
        },
        reviews: [serializeReview(review)],
      };
    },
  );
}

export async function submitSelfPerformanceReview(
  auth: AuthContext,
  reviewId: string,
  input: { selfRating: number; selfNote?: string },
) {
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
      permission: "performance:review_self_write",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const review = await tx.performanceReviewV2.findFirst({
        where: { id: reviewId, tenantId: auth.tenantId, employeeId },
        include: { cycle: true },
      });
      if (!review) {
        throw new ApiError(404, {
          code: "not_found",
          message: "review_not_found",
        });
      }
      if (review.cycle.status !== "OPEN") {
        throw new ApiError(409, {
          code: "conflict",
          message: "performance_cycle_not_open",
        });
      }
      if (input.selfRating < 1 || input.selfRating > review.cycle.ratingScaleMax) {
        throw new ApiError(400, {
          code: "validation_error",
          message: "rating_out_of_range",
        });
      }

      const updated = await tx.performanceReviewV2.update({
        where: { id: review.id },
        data: {
          selfRating: input.selfRating,
          selfNote: input.selfNote?.trim().slice(0, 4000) ?? null,
          status: "EMPLOYEE_SUBMITTED",
        },
      });
      return serializeReview(updated);
    },
  );
}

export async function listManagerTeamReviews(auth: AuthContext) {
  const managerEmployeeId = auth.subjectEmployeeId;
  if (!managerEmployeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "performance:review_team_write",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const openCycle = await tx.performanceCycle.findFirst({
        where: { tenantId: auth.tenantId, status: "OPEN" },
        orderBy: { startDate: "desc" },
      });
      if (!openCycle) return { cycle: null, reviews: [] };

      const reports = await tx.employee.findMany({
        where: {
          tenantId: auth.tenantId,
          managerId: managerEmployeeId,
          status: "ACTIVE",
        },
        select: { id: true, firstName: true, lastName: true },
      });

      const reviews = [];
      for (const report of reports) {
        let review = await tx.performanceReviewV2.findFirst({
          where: {
            tenantId: auth.tenantId,
            cycleId: openCycle.id,
            employeeId: report.id,
          },
        });
        if (!review) {
          review = await tx.performanceReviewV2.create({
            data: {
              tenantId: auth.tenantId,
              cycleId: openCycle.id,
              employeeId: report.id,
              managerSubjectId: auth.subjectId,
              status: "DRAFT",
            },
          });
        }
        reviews.push({
          ...serializeReview(review),
          employeeName:
            [report.firstName, report.lastName].filter(Boolean).join(" ") ||
            report.id,
        });
      }

      return {
        cycle: {
          id: openCycle.id,
          name: openCycle.name,
          startDate: openCycle.startDate.toISOString().slice(0, 10),
          endDate: openCycle.endDate.toISOString().slice(0, 10),
          ratingScaleMax: openCycle.ratingScaleMax,
        },
        reviews,
      };
    },
  );
}

export async function submitManagerPerformanceReview(
  auth: AuthContext,
  reviewId: string,
  input: { managerRating: number; managerNote?: string },
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "performance:review_team_write",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const review = await tx.performanceReviewV2.findFirst({
        where: { id: reviewId, tenantId: auth.tenantId },
        include: { cycle: true },
      });
      if (!review) {
        throw new ApiError(404, {
          code: "not_found",
          message: "review_not_found",
        });
      }
      const employee = await tx.employee.findFirst({
        where: { id: review.employeeId, tenantId: auth.tenantId },
        select: { managerId: true },
      });
      if (employee?.managerId !== auth.subjectEmployeeId) {
        throw new ApiError(403, {
          code: "forbidden",
          message: "not_direct_report",
        });
      }
      if (review.cycle.status !== "OPEN") {
        throw new ApiError(409, {
          code: "conflict",
          message: "performance_cycle_not_open",
        });
      }
      if (
        input.managerRating < 1 ||
        input.managerRating > review.cycle.ratingScaleMax
      ) {
        throw new ApiError(400, {
          code: "validation_error",
          message: "rating_out_of_range",
        });
      }

      const updated = await tx.performanceReviewV2.update({
        where: { id: review.id },
        data: {
          managerRating: input.managerRating,
          managerNote: input.managerNote?.trim().slice(0, 4000) ?? null,
          managerSubjectId: auth.subjectId,
          status: "MANAGER_SUBMITTED",
        },
      });
      return serializeReview(updated);
    },
  );
}

function serializeReview(row: {
  id: string;
  cycleId: string;
  employeeId: string;
  status: string;
  selfRating: number | null;
  managerRating: number | null;
  selfNote: string | null;
  managerNote: string | null;
}) {
  return {
    id: row.id,
    cycleId: row.cycleId,
    employeeId: row.employeeId,
    status: row.status,
    selfRating: row.selfRating,
    managerRating: row.managerRating,
    selfNote: row.selfNote,
    managerNote: row.managerNote,
  };
}
