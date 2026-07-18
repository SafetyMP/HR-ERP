/**
 * Hard-delete soft-deleted rows whose retention_expires_at has elapsed.
 * Run via: npm run worker:retention-purge
 */
import { prisma } from "@/lib/prisma";

async function main() {
  const now = new Date();
  const expired = { lt: now } as const;

  const [employees, candidates, jobOffers, benefitEnrollments] =
    await Promise.all([
      prisma.employee.deleteMany({
        where: { retentionExpiresAt: expired },
      }),
      prisma.candidate.deleteMany({
        where: { retentionExpiresAt: expired },
      }),
      prisma.jobOffer.deleteMany({
        where: { retentionExpiresAt: expired },
      }),
      prisma.benefitEnrollment.deleteMany({
        where: { retentionExpiresAt: expired },
      }),
    ]);

  console.log(
    JSON.stringify({
      msg: "retention_purge_done",
      deleted: {
        employees: employees.count,
        candidates: candidates.count,
        jobOffers: jobOffers.count,
        benefitEnrollments: benefitEnrollments.count,
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
