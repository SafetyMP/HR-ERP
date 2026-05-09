#!/usr/bin/env node
import { SignJWT } from "jose";

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 16) {
  console.error("JWT_SECRET must be set (min 16 chars).");
  process.exit(1);
}

const key = new TextEncoder().encode(secret);

const tenantId =
  process.env.DEV_TENANT_ID ?? "11111111-1111-1111-1111-111111111111";
const subject =
  process.env.DEV_SUBJECT_ID ?? "22222222-2222-2222-2222-222222222222";

const roles = (process.env.DEV_ROLES ?? "hr_admin")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

const subjectEmployeeId = process.env.DEV_SUBJECT_EMPLOYEE_ID?.trim();

const payload = {
  tenant_id: tenantId,
  roles,
  mfa_level: "standard",
  ...(subjectEmployeeId ? { subject_employee_id: subjectEmployeeId } : {}),
};

const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(subject)
  .setIssuedAt()
  .setExpirationTime("2h")
  .sign(key);

console.log(token);
