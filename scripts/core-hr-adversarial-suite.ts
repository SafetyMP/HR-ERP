#!/usr/bin/env npx tsx
/**
 * Core HR domain adversarial cases for ./scripts/adversarial.sh (R-010/R-015).
 * Requires provisioned app DATABASE_URL + JWT_SECRET (not extraction CORE_HR_DATABASE_URL).
 * Local HS256 demo JWT — not production issuer posture (R-018).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";

import { POST as postDepartment } from "@/app/api/v1/departments/route";
import { POST as postEmployee } from "@/app/api/v1/employees/route";
import { POST as postJobRole } from "@/app/api/v1/job-roles/route";
import { ensureOrganization } from "@/lib/core-hr/writes";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { signHrAccessToken } from "@/lib/security/jwt";
import { withTenantTransaction } from "@/lib/security/with-tenant-transaction";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function authHeaders(token: string): HeadersInit {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    "x-correlation-id": randomUUID(),
  };
}

async function main(): Promise<void> {
  const databaseUrl = (process.env.DATABASE_URL ?? "").trim();
  const jwtSecret = (process.env.JWT_SECRET ?? "").trim();
  assert(databaseUrl, "DATABASE_URL required for Core HR adversarial suite");
  assert(jwtSecret.length >= 16, "JWT_SECRET required");
  // Refuse extraction DSN (wrong DB for this slice).
  assert(
    !/\/core_hr(\?|$)/.test(databaseUrl) && !databaseUrl.includes(":5433/"),
    "refusing CORE_HR extraction DSN; use HR ERP app DATABASE_URL",
  );

  const tenantId = randomUUID();
  const marker = `adv-${tenantId.slice(0, 8)}`;
  console.log(`== Core HR adversarial suite (tenant=${tenantId}) ==`);
  console.log("  note  local HS256 demo JWT — not production JWT/JWKS posture (R-018)");

  await ensureOrganization(tenantId, `Core HR Adv ${marker}`);
  const token = await signHrAccessToken({
    sub: randomUUID(),
    tenantId,
    roles: ["hr_admin"],
    mfaLevel: "standard",
    expiresIn: "1h",
  });

  const deptRes = await postDepartment(
    new Request("http://local/api/v1/departments", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        name: `Adv Eng ${marker}`,
        code: `AE-${marker.slice(-6)}`,
      }),
    }),
  );
  assert(deptRes.status === 201, "seed department");
  const dept = ((await deptRes.json()) as { data: { department: { id: string } } }).data
    .department;

  // R-002 hierarchy negatives
  const badParent = await postDepartment(
    new Request("http://local/api/v1/departments", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        name: `Orphan ${marker}`,
        code: `OR-${marker.slice(-6)}`,
        parentId: randomUUID(),
      }),
    }),
  );
  assert(badParent.status >= 400 && badParent.status < 500, "R-002 unknown parent → 4xx");
  const badParentBody = JSON.stringify(await badParent.json());
  assert(!/@example\.|password|stack/i.test(badParentBody), "R-007 PII/stack free errors");

  const roleRes = await postJobRole(
    new Request("http://local/api/v1/job-roles", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ title: `Adv Role ${marker}`, departmentId: dept.id }),
    }),
  );
  assert(roleRes.status === 201, "seed job role");
  const role = ((await roleRes.json()) as { data: { jobRole: { id: string } } }).data.jobRole;

  // Inactive department reference (R-005)
  const inactiveDeptRes = await postDepartment(
    new Request("http://local/api/v1/departments", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        name: `Inactive ${marker}`,
        code: `IN-${marker.slice(-6)}`,
        status: "INACTIVE",
      }),
    }),
  );
  assert(inactiveDeptRes.status === 201, "create inactive department");
  const inactiveDept = (
    (await inactiveDeptRes.json()) as { data: { department: { id: string } } }
  ).data.department;

  const inactiveEmp = await postEmployee(
    new Request("http://local/api/v1/employees", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        email: `inactive.${marker}@example.test`,
        departmentId: inactiveDept.id,
        jobRoleId: role.id,
      }),
    }),
  );
  assert(inactiveEmp.status >= 400 && inactiveEmp.status < 500, "R-005 inactive dept → 4xx");
  const inactiveBody = JSON.stringify(await inactiveEmp.json());
  assert(!inactiveBody.includes("example.test"), "R-007 no email echo in error");

  // R-010 injection inert
  const inject = `<script>alert(1)</script> ${marker}`;
  const injectRes = await postJobRole(
    new Request("http://local/api/v1/job-roles", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ title: inject }),
    }),
  );
  assert(injectRes.status === 201, "R-010 injection-like title stored");
  const injectRole = ((await injectRes.json()) as { data: { jobRole: { title: string } } }).data
    .jobRole;
  assert(injectRole.title === inject, "R-010 returned inert");

  // Unknown field / closed schema (R-007)
  const unk = await postEmployee(
    new Request("http://local/api/v1/employees", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        email: `unk.${marker}@example.test`,
        departmentId: dept.id,
        jobRoleId: role.id,
        ssn: "000-00-0000",
      }),
    }),
  );
  assert(unk.status === 400, "R-007 unknown field rejected");
  const unkBody = JSON.stringify(await unk.json());
  assert(!unkBody.includes("000-00-0000"), "R-007 no SSN echo");

  await withTenantTransaction(prisma, tenantId, async (tx) => {
    await tx.employee.deleteMany({ where: { tenantId } });
    await tx.jobRole.deleteMany({ where: { tenantId } });
    await tx.department.updateMany({ where: { tenantId }, data: { parentId: null } });
    await tx.department.deleteMany({ where: { tenantId } });
    await tx.organization.delete({ where: { id: tenantId } }).catch(() => undefined);
  });

  await prisma.$disconnect().catch(() => undefined);
  const redis = getRedis();
  if (redis) await redis.quit().catch(() => undefined);
  console.log("  ok  Core HR adversarial domain (hierarchy/inactive/PII/injection)");
  console.log("core-hr-adversarial-suite: ok");
  process.exit(0);
}

main().catch(async (err) => {
  console.error("core-hr-adversarial-suite: FAIL", err);
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
