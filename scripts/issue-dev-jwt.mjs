#!/usr/bin/env node
/**
 * Mint HS256 JWT for local `/api/v1/*`. Loads `.env` from cwd so `JWT_SECRET`
 * matches `npm run dev` (avoid signing with a different secret).
 *
 *   npm run jwt:dev
 *
 * For **Vercel Production**, use the same signing secret as the deployment:
 *   npm run jwt:dev:vercel
 *   (runs `vercel env run -e production` so encrypted secrets are injected; `env pull` omits them in the file.)
 *
 * Manager demo (Alex): DEV_ROLES=manager DEV_SUBJECT_EMPLOYEE_ID=b0000001-0001-4000-8000-000000000020 npm run jwt:dev
 *
 * Omit employee claim (rare): DEV_OMIT_SUBJECT_EMPLOYEE_ID=1 npm run jwt:dev
 */
import dotenv from "dotenv";

dotenv.config();
if (process.env.JWT_DEV_ENV_FILE?.trim()) {
  dotenv.config({ path: process.env.JWT_DEV_ENV_FILE.trim(), override: true });
}

import { SignJWT } from "jose";

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 16) {
  console.error(
    "JWT_SECRET must be set (min 16 chars). For local `npm run dev`, use `.env`. For Vercel Production tokens: `npm run jwt:dev:vercel` (linked project, `vercel env run` with Production env).",
  );
  process.exit(1);
}

const key = new TextEncoder().encode(secret);

const tenantId =
  process.env.DEV_TENANT_ID?.trim() ||
  process.env.DEMO_TENANT_ID?.trim() ||
  process.env.NEXT_PUBLIC_DEMO_TENANT_ID?.trim() ||
  "default-tenant";

const subject =
  process.env.DEV_SUBJECT_ID?.trim() || "22222222-2222-2222-2222-222222222222";

const roles = (process.env.DEV_ROLES ?? "employee")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

const defaultJordan =
  process.env.DEMO_PAYSTUB_EMPLOYEE_ID?.trim() ||
  "b0000001-0001-4000-8000-000000000011";

const subjectEmployeeId =
  process.env.DEV_SUBJECT_EMPLOYEE_ID?.trim() || defaultJordan;

const omitEmployee =
  process.env.DEV_OMIT_SUBJECT_EMPLOYEE_ID === "1" ||
  process.env.DEV_OMIT_SUBJECT_EMPLOYEE_ID === "true";

const payload = {
  tenant_id: tenantId,
  roles,
  mfa_level: "standard",
  ...(omitEmployee ? {} : { subject_employee_id: subjectEmployeeId }),
};

const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(subject)
  .setIssuedAt()
  .setExpirationTime("2h")
  .sign(key);

console.warn(
  `[issue-dev-jwt] tenant=${tenantId} roles=${roles.join(",")}${omitEmployee ? "" : ` subject_employee_id=${subjectEmployeeId}`} → paste the next line into Profile (dev)`,
);

console.log(token);
