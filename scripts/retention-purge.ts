/**
 * Hard-delete soft-deleted rows whose retention_expires_at has elapsed.
 * Drain role lists tenants; app role + tenant GUC performs deletes.
 * Run via: npm run worker:retention-purge
 */
import { prisma } from "@/lib/prisma";
import { getDrainPrisma } from "@/lib/security/drain-db";
import { withTenantTransaction } from "@/lib/security/with-tenant-transaction";

async function main() {
  const drain = getDrainPrisma();
  const now = new Date();
  const expired = { lt: now } as const;

  const [empTenants, candTenants, offerTenants, benefitTenants] =
    await Promise.all([
      drain.employee.findMany({
        where: { retentionExpiresAt: expired },
        select: { tenantId: true },
        distinct: ["tenantId"],
      }),
      drain.candidate.findMany({
        where: { retentionExpiresAt: expired },
        select: { tenantId: true },
        distinct: ["tenantId"],
      }),
      drain.jobOffer.findMany({
        where: { retentionExpiresAt: expired },
        select: { tenantId: true },
        distinct: ["tenantId"],
      }),
      drain.benefitEnrollment.findMany({
        where: { retentionExpiresAt: expired },
        select: { tenantId: true },
        distinct: ["tenantId"],
      }),
    ]);

  const tenantIds = new Set<string>([
    ...empTenants.map((r) => r.tenantId),
    ...candTenants.map((r) => r.tenantId),
    ...offerTenants.map((r) => r.tenantId),
    ...benefitTenants.map((r) => r.tenantId),
  ]);

  let employees = 0;
  let candidates = 0;
  let jobOffers = 0;
  let benefitEnrollments = 0;

  for (const tenantId of tenantIds) {
    await withTenantTransaction(prisma, tenantId, async (tx) => {
      const [e, c, j, b] = await Promise.all([
        tx.employee.deleteMany({ where: { retentionExpiresAt: expired } }),
        tx.candidate.deleteMany({ where: { retentionExpiresAt: expired } }),
        tx.jobOffer.deleteMany({ where: { retentionExpiresAt: expired } }),
        tx.benefitEnrollment.deleteMany({
          where: { retentionExpiresAt: expired },
        }),
      ]);
      employees += e.count;
      candidates += c.count;
      jobOffers += j.count;
      benefitEnrollments += b.count;
    });
  }

  console.log(
    JSON.stringify({
      msg: "retention_purge_done",
      tenants: tenantIds.size,
      deleted: {
        employees,
        candidates,
        jobOffers,
        benefitEnrollments,
      },
    }),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
