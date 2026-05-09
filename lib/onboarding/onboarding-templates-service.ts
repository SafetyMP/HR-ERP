import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type OnboardingTemplateSummaryPayload = {
  id: string;
  title: string;
  itemCount: number;
};

export async function listOnboardingTemplates(
  auth: AuthContext,
): Promise<OnboardingTemplateSummaryPayload[]> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "hr:onboarding_template_assign",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const templates = await tx.onboardingTemplate.findMany({
        where: { tenantId: auth.tenantId },
        orderBy: [{ title: "asc" }],
        include: { _count: { select: { items: true } } },
      });

      return templates.map((t) => ({
        id: t.id,
        title: t.title,
        itemCount: t._count.items,
      }));
    },
  );
}

export async function applyOnboardingTemplateToEmployee(
  auth: AuthContext,
  input: { employeeId: string; templateId: string },
): Promise<{ createdTasks: number }> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "hr:onboarding_template_assign",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const employee = await tx.employee.findFirst({
        where: { id: input.employeeId, tenantId: auth.tenantId },
        select: { id: true },
      });
      if (!employee) {
        throw new ApiError(404, {
          code: "not_found",
          message: "employee_not_found",
        });
      }

      const template = await tx.onboardingTemplate.findFirst({
        where: { id: input.templateId, tenantId: auth.tenantId },
        include: {
          items: { orderBy: [{ sortOrder: "asc" }, { title: "asc" }] },
        },
      });
      if (!template) {
        throw new ApiError(404, {
          code: "not_found",
          message: "onboarding_template_not_found",
        });
      }

      let created = 0;
      for (const item of template.items) {
        const exists = await tx.onboardingTask.findFirst({
          where: { employeeId: employee.id, title: item.title },
          select: { id: true },
        });
        if (exists) continue;

        await tx.onboardingTask.create({
          data: {
            employeeId: employee.id,
            title: item.title,
            status: "PENDING",
          },
        });
        created += 1;
      }

      return { createdTasks: created };
    },
  );
}
