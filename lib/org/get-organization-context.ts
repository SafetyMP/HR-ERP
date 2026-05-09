import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type OrgPersonCard = {
  employeeId: string;
  displayName: string;
};

export type OrganizationContextPayload = {
  self: OrgPersonCard;
  managerChain: OrgPersonCard[];
  peers: OrgPersonCard[];
  department: { name: string; code: string | null } | null;
};

function displayName(e: {
  preferredName: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  const pref = e.preferredName?.trim();
  if (pref) return pref;
  const parts = [e.firstName?.trim(), e.lastName?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : "Colleague";
}

export async function getMyOrganizationContext(auth: AuthContext): Promise<OrganizationContextPayload> {
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
      permission: "employees:read",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const self = await tx.employee.findFirst({
        where: { id: employeeId, tenantId: auth.tenantId },
        select: {
          id: true,
          preferredName: true,
          firstName: true,
          lastName: true,
          managerId: true,
          department: { select: { name: true, code: true } },
        },
      });
      if (!self) {
        throw new ApiError(404, {
          code: "not_found",
          message: "employee_not_found",
        });
      }

      const managerChain: OrgPersonCard[] = [];
      let walkId: string | null = self.managerId;
      let guard = 0;
      while (walkId && guard++ < 12) {
        const mgr = await tx.employee.findFirst({
          where: { id: walkId, tenantId: auth.tenantId },
          select: {
            id: true,
            preferredName: true,
            firstName: true,
            lastName: true,
            managerId: true,
          },
        });
        if (!mgr) break;
        managerChain.push({
          employeeId: mgr.id,
          displayName: displayName(mgr),
        });
        walkId = mgr.managerId;
      }

      const peers =
        self.managerId === null
          ? []
          : await tx.employee.findMany({
              where: {
                tenantId: auth.tenantId,
                managerId: self.managerId,
                NOT: { id: self.id },
              },
              select: {
                id: true,
                preferredName: true,
                firstName: true,
                lastName: true,
              },
              orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
              take: 50,
            });

      return {
        self: {
          employeeId: self.id,
          displayName: displayName(self),
        },
        managerChain,
        peers: peers.map((p) => ({
          employeeId: p.id,
          displayName: displayName(p),
        })),
        department: self.department
          ? { name: self.department.name, code: self.department.code }
          : null,
      };
    },
  );
}
