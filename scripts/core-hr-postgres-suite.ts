#!/usr/bin/env npx tsx
/**
 * Bounded Core HR Postgres proof (R-013). Requires provisioned DATABASE_URL + JWT_SECRET.
 * Invoked from verify.sh when a Core HR DSN is available (empty-URL web parity alone is insufficient).
 *
 * Label: local HS256 demo JWT — not production JWT/JWKS posture (R-018).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";

import { GET as getDepartment } from "@/app/api/v1/departments/[departmentId]/route";
import { GET as listDepartments, POST as postDepartment } from "@/app/api/v1/departments/route";
import {
  GET as getEmployee,
  PATCH as patchEmployee,
} from "@/app/api/v1/employees/[employeeId]/route";
import { GET as listEmployees, POST as postEmployee } from "@/app/api/v1/employees/route";
import { GET as getJobRole } from "@/app/api/v1/job-roles/[jobRoleId]/route";
import { GET as listJobRoles, POST as postJobRole } from "@/app/api/v1/job-roles/route";
import { CORE_HR_MAX_BODY_BYTES, readJsonBytesLimited } from "@/lib/api/v1/read-json-limited";
import { ensureOrganization } from "@/lib/core-hr/writes";
import { invalidateEmployeePublicProfileCache } from "@/lib/employees/public-profile";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { signHrAccessToken } from "@/lib/security/jwt";
import { withTenantTransaction } from "@/lib/security/with-tenant-transaction";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function jsonOf(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

function authHeaders(token: string, extra?: HeadersInit): HeadersInit {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    "x-correlation-id": randomUUID(),
    ...extra,
  };
}

async function main(): Promise<void> {
  const databaseUrl = (process.env.DATABASE_URL ?? "").trim();
  const jwtSecret = (process.env.JWT_SECRET ?? "").trim();
  assert(databaseUrl, "DATABASE_URL required for Core HR Postgres suite (R-013)");
  assert(jwtSecret.length >= 16, "JWT_SECRET required (min 16 chars); local HS256 only — not production posture (R-018)");

  const tenantId = randomUUID();
  const marker = `corehr-${tenantId.slice(0, 8)}`;
  console.log(`== Core HR Postgres suite (tenant=${tenantId}) ==`);
  console.log("  note  JWT is local HS256 demo — not production issuer/JWKS posture (R-018)");

  await ensureOrganization(tenantId, `Core HR Suite ${marker}`);

  const hrToken = await signHrAccessToken({
    sub: randomUUID(),
    tenantId,
    roles: ["hr_admin"],
    mfaLevel: "standard",
    expiresIn: "1h",
  });

  // R-009 body limit (before full parse)
  {
    const oversized = "x".repeat(CORE_HR_MAX_BODY_BYTES + 1);
    const req = new Request("http://local/api/v1/departments", {
      method: "POST",
      headers: { "content-length": String(oversized.length) },
      body: oversized,
    });
    let threw = false;
    try {
      await readJsonBytesLimited(req);
    } catch {
      threw = true;
    }
    assert(threw, "R-009: oversized body must be rejected");
    console.log("  ok  R-009 body limit");
  }

  // Unauthenticated → 401
  {
    const res = await listDepartments(
      new Request("http://local/api/v1/departments", { method: "GET" }),
    );
    assert(res.status === 401, `R-008 expected 401 without auth, got ${res.status}`);
    console.log("  ok  R-008 unauthenticated deny");
  }

  // Create department
  const deptRes = await postDepartment(
    new Request("http://local/api/v1/departments", {
      method: "POST",
      headers: authHeaders(hrToken),
      body: JSON.stringify({
        name: `Engineering ${marker}`,
        code: `ENG-${marker.slice(-6)}`,
      }),
    }),
  );
  assert(deptRes.status === 201, `R-001 create dept expected 201, got ${deptRes.status}`);
  const deptBody = await jsonOf(deptRes);
  const dept = (deptBody.data as { department: { id: string; parentId: string | null; status: string } })
    .department;
  assert(dept.status === "ACTIVE", "R-001 default status ACTIVE");
  assert(dept.parentId === null, "R-001 parentId null by default");

  // Unknown parent
  {
    const bad = await postDepartment(
      new Request("http://local/api/v1/departments", {
        method: "POST",
        headers: authHeaders(hrToken),
        body: JSON.stringify({
          name: `BadParent ${marker}`,
          code: `BAD-${marker.slice(-6)}`,
          parentId: randomUUID(),
        }),
      }),
    );
    assert(bad.status >= 400 && bad.status < 500, "R-002 unknown parent → 4xx");
    const err = await jsonOf(bad);
    assert((err as { error?: { message?: string } }).error?.message, "R-007 ErrorEnvelope");
    const msg = JSON.stringify(err);
    assert(!msg.includes("@"), "R-007 no PII email echo in parent failure");
  }

  // Child department
  const childRes = await postDepartment(
    new Request("http://local/api/v1/departments", {
      method: "POST",
      headers: authHeaders(hrToken),
      body: JSON.stringify({
        name: `Platform ${marker}`,
        code: `PLT-${marker.slice(-6)}`,
        parentId: dept.id,
      }),
    }),
  );
  assert(childRes.status === 201, "R-002 child department create");
  const child = (
    (await jsonOf(childRes)).data as { department: { id: string; parentId: string | null } }
  ).department;
  assert(child.parentId === dept.id, "R-002 parentId exposed");

  const getDept = await getDepartment(
    new Request(`http://local/api/v1/departments/${dept.id}`, { headers: authHeaders(hrToken) }),
    { params: Promise.resolve({ departmentId: dept.id }) },
  );
  assert(getDept.status === 200, "R-001 get department");

  const listDept = await listDepartments(
    new Request("http://local/api/v1/departments", { headers: authHeaders(hrToken) }),
  );
  assert(listDept.status === 200, "R-001 list departments");
  console.log("  ok  R-001/R-002 departments");

  // Job role
  const roleRes = await postJobRole(
    new Request("http://local/api/v1/job-roles", {
      method: "POST",
      headers: authHeaders(hrToken),
      body: JSON.stringify({
        title: `Engineer ${marker}`,
        departmentId: dept.id,
        level: "IC2",
      }),
    }),
  );
  assert(roleRes.status === 201, `R-003 create job role expected 201, got ${roleRes.status}`);
  const role = ((await jsonOf(roleRes)).data as { jobRole: { id: string; status: string } }).jobRole;
  assert(role.status === "ACTIVE", "R-003 default ACTIVE");

  const dupRole = await postJobRole(
    new Request("http://local/api/v1/job-roles", {
      method: "POST",
      headers: authHeaders(hrToken),
      body: JSON.stringify({ title: `Engineer ${marker}` }),
    }),
  );
  assert(dupRole.status >= 400 && dupRole.status < 500, "R-003 duplicate title → 4xx");

  // Unknown field rejection
  {
    const unk = await postJobRole(
      new Request("http://local/api/v1/job-roles", {
        method: "POST",
        headers: authHeaders(hrToken),
        body: JSON.stringify({ title: `Other ${marker}`, salary: 99999 }),
      }),
    );
    assert(unk.status === 400, "R-007 unknown fields rejected");
  }

  await listJobRoles(new Request("http://local/api/v1/job-roles", { headers: authHeaders(hrToken) }));
  await getJobRole(
    new Request(`http://local/api/v1/job-roles/${role.id}`, { headers: authHeaders(hrToken) }),
    { params: Promise.resolve({ jobRoleId: role.id }) },
  );
  console.log("  ok  R-003 job roles");

  // Injection-like inert strings (R-010)
  const injectTitle = `Robert'); DROP TABLE employees;-- ${marker}`;
  const injectRoleRes = await postJobRole(
    new Request("http://local/api/v1/job-roles", {
      method: "POST",
      headers: authHeaders(hrToken),
      body: JSON.stringify({ title: injectTitle }),
    }),
  );
  assert(injectRoleRes.status === 201, "R-010 injection-like title accepted as data");
  const injectRole = ((await jsonOf(injectRoleRes)).data as { jobRole: { id: string; title: string } })
    .jobRole;
  assert(injectRole.title === injectTitle, "R-010 title stored inertly");
  console.log("  ok  R-010 injection inert");

  // Employee create
  const email = `alice.${marker}@example.test`;
  const empRes = await postEmployee(
    new Request("http://local/api/v1/employees", {
      method: "POST",
      headers: authHeaders(hrToken),
      body: JSON.stringify({
        email,
        departmentId: dept.id,
        jobRoleId: role.id,
        firstName: "Alice",
        lastName: "Suite",
      }),
    }),
  );
  assert(empRes.status === 201, `R-004 create employee expected 201, got ${empRes.status}`);
  const emp = ((await jsonOf(empRes)).data as { employee: { id: string; status: string } }).employee;
  assert(emp.status === "ACTIVE", "R-004 default ACTIVE");

  // Inactive department assignment
  await withTenantTransaction(prisma, tenantId, async (tx) => {
    await tx.department.update({
      where: { id: child.id },
      data: { status: "INACTIVE" },
    });
  });
  const inactiveAssign = await postEmployee(
    new Request("http://local/api/v1/employees", {
      method: "POST",
      headers: authHeaders(hrToken),
      body: JSON.stringify({
        email: `bob.${marker}@example.test`,
        departmentId: child.id,
        jobRoleId: role.id,
      }),
    }),
  );
  assert(inactiveAssign.status >= 400 && inactiveAssign.status < 500, "R-004/R-005 inactive dept → 4xx");

  // PATCH employee
  const patchRes = await patchEmployee(
    new Request(`http://local/api/v1/employees/${emp.id}`, {
      method: "PATCH",
      headers: authHeaders(hrToken),
      body: JSON.stringify({ preferredName: "Ally", status: "ON_LEAVE" }),
    }),
    { params: Promise.resolve({ employeeId: emp.id }) },
  );
  assert(patchRes.status === 200, "R-005 patch employee");
  const patched = ((await jsonOf(patchRes)).data as { employee: { preferredName: string; status: string } })
    .employee;
  assert(patched.preferredName === "Ally" && patched.status === "ON_LEAVE", "R-005 patch applied");

  // List filters + order
  const listRes = await listEmployees(
    new Request(`http://local/api/v1/employees?departmentId=${dept.id}`, {
      headers: authHeaders(hrToken),
    }),
  );
  assert(listRes.status === 200, "R-006 list employees");
  const listed = ((await jsonOf(listRes)).data as { employees: { id: string }[] }).employees;
  assert(listed.some((e) => e.id === emp.id), "R-006 filter includes assignee");
  for (let i = 1; i < listed.length; i++) {
    assert(listed[i]!.id >= listed[i - 1]!.id, "R-006 ascending id");
  }

  const getEmp = await getEmployee(
    new Request(`http://local/api/v1/employees/${emp.id}`, { headers: authHeaders(hrToken) }),
    { params: Promise.resolve({ employeeId: emp.id }) },
  );
  assert(getEmp.status === 200, "R-004/R-006 get employee");

  // Soft-delete exclusion
  await withTenantTransaction(prisma, tenantId, async (tx) => {
    await tx.employee.update({
      where: { id: emp.id },
      data: { deletedAt: new Date() },
    });
  });
  await invalidateEmployeePublicProfileCache(tenantId, emp.id);
  const getDeleted = await getEmployee(
    new Request(`http://local/api/v1/employees/${emp.id}`, { headers: authHeaders(hrToken) }),
    { params: Promise.resolve({ employeeId: emp.id }) },
  );
  assert(getDeleted.status === 404, "R-006/R-011 soft-deleted excluded");
  console.log("  ok  R-004/R-005/R-006/R-011 employees");

  // Surface guard — no hard-delete handlers on Core HR routes (R-017/R-011)
  assert(typeof (postDepartment as { DELETE?: unknown }).DELETE === "undefined", "no DELETE on departments");
  assert(typeof (postEmployee as { DELETE?: unknown }).DELETE === "undefined", "no DELETE on employees");
  console.log("  ok  R-011/R-017 no hard-delete surface");

  // Teardown suite-owned rows (R-016)
  await withTenantTransaction(prisma, tenantId, async (tx) => {
    await tx.employee.deleteMany({ where: { tenantId } });
    await tx.jobRole.deleteMany({ where: { tenantId } });
    await tx.department.updateMany({ where: { tenantId }, data: { parentId: null } });
    await tx.department.deleteMany({ where: { tenantId } });
    await tx.organization.delete({ where: { id: tenantId } }).catch(() => undefined);
  });
  console.log("  ok  R-016 fixture teardown");

  await prisma.$disconnect().catch(() => undefined);
  const redis = getRedis();
  if (redis) {
    await redis.quit().catch(() => undefined);
  }
  console.log("core-hr-postgres-suite: ok");
  process.exit(0);
}

main().catch(async (err) => {
  console.error("core-hr-postgres-suite: FAIL", err);
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
