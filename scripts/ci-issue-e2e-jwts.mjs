#!/usr/bin/env node
/**
 * Mint Playwright e2e JWTs for CI and print export lines for GITHUB_ENV.
 *
 *   node scripts/ci-issue-e2e-jwts.mjs
 *   node scripts/ci-issue-e2e-jwts.mjs --github-env >> $GITHUB_ENV
 */
import dotenv from "dotenv";
import { SignJWT } from "jose";

dotenv.config();

const secret = (process.env.JWT_SECRET ?? "").trim();
if (!secret || secret.length < 16) {
  console.error("JWT_SECRET must be set (min 16 chars) for ci-issue-e2e-jwts");
  process.exit(1);
}

const key = new TextEncoder().encode(secret);
const tenantId =
  process.env.DEV_TENANT_ID?.trim() ||
  process.env.DEMO_TENANT_ID?.trim() ||
  "default-tenant";
const employeeId =
  process.env.DEV_SUBJECT_EMPLOYEE_ID?.trim() ||
  "b0000001-0001-4000-8000-000000000011";
const managerId =
  process.env.DEV_MANAGER_EMPLOYEE_ID?.trim() ||
  "b0000001-0001-4000-8000-000000000020";

async function sign(roles, subjectEmployeeId, subSuffix) {
  const payload = {
    tenant_id: tenantId,
    roles,
    mfa_level: "standard",
    subject_employee_id: subjectEmployeeId,
  };
  if (roles.includes("manager")) {
    payload.manager_employee_id = managerId;
  }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(`ci-e2e-${subSuffix}`)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}

const specs = [
  ["HR_ERP_PAYSTUB_E2E_JWT", ["employee"], employeeId, "paystub"],
  ["HR_ERP_TIME_E2E_JWT", ["employee"], employeeId, "time"],
  ["HR_ERP_BENEFITS_E2E_JWT", ["employee"], employeeId, "benefits"],
  ["HR_ERP_PROFILE_E2E_JWT", ["employee"], employeeId, "profile"],
  ["HR_ERP_PTO_E2E_JWT", ["employee"], employeeId, "pto"],
  ["HR_ERP_LEAVE_E2E_JWT", ["employee"], employeeId, "leave"],
  ["HR_ERP_MANAGER_TEAM_E2E_JWT", ["manager"], managerId, "manager-team"],
  ["HR_ERP_ONBOARDING_E2E_JWT", ["employee"], employeeId, "onboarding"],
  ["HR_ERP_HR_CASE_E2E_JWT", ["employee"], employeeId, "hr-case"],
  ["HR_ERP_RECRUITING_E2E_JWT", ["manager"], managerId, "recruiting"],
  ["HR_ERP_PAYROLL_RUNS_E2E_JWT", ["hr_admin"], employeeId, "payroll-runs"],
  ["HR_ERP_LEARNING_E2E_JWT", ["employee"], employeeId, "learning"],
  ["HR_ERP_PERFORMANCE_E2E_JWT", ["employee"], employeeId, "performance"],
  ["HR_ERP_MANAGER_PERF_E2E_JWT", ["manager"], managerId, "manager-perf"],
];

const githubEnv = process.argv.includes("--github-env");
const lines = [];

for (const [envName, roles, subjectId, suffix] of specs) {
  const token = await sign(roles, subjectId, suffix);
  if (githubEnv) {
    lines.push(`${envName}=${token}`);
  } else {
    console.log(`${envName}=${token}`);
  }
}

if (githubEnv) {
  process.stdout.write(lines.join("\n") + "\n");
}
