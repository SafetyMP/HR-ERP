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
 * If you set `JWT_DEV_ENV_FILE` to a pulled `.env.vercel.production`, empty `JWT_SECRET` there will **not**
 * override a valid secret already loaded from `.env` or injected env (see script body).
 *
 * Manager demo (Alex): DEV_ROLES=manager DEV_SUBJECT_EMPLOYEE_ID=b0000001-0001-4000-8000-000000000020 npm run jwt:dev
 *
 * Omit employee claim (rare): DEV_OMIT_SUBJECT_EMPLOYEE_ID=1 npm run jwt:dev
 */
import dotenv from "dotenv";

const argvJoined = process.argv.join(" ");
const usesVercelProduction =
  process.env.VERCEL_ENV === "production" ||
  argvJoined.includes("vercel env run") ||
  (process.env.npm_lifecycle_event ?? "").includes(":vercel");

if (usesVercelProduction && process.env.ALLOW_PRODUCTION_JWT_MINT !== "1") {
  console.error(
    "Refusing to mint JWT against production secrets. Set ALLOW_PRODUCTION_JWT_MINT=1 only with explicit Human authorization.",
  );
  process.exit(1);
}

dotenv.config();
const jwtAfterPrimary = (process.env.JWT_SECRET ?? "").trim();

if (process.env.JWT_DEV_ENV_FILE?.trim()) {
  const envFilePath = process.env.JWT_DEV_ENV_FILE.trim();
  dotenv.config({ path: envFilePath, override: true });
  const jwtAfterSecondary = (process.env.JWT_SECRET ?? "").trim();
  // `vercel env pull` often writes JWT_SECRET="" for Encrypted vars — do not let
  // that wipe a real secret from `.env`, `vercel env run`, or the first dotenv load.
  if (jwtAfterSecondary.length < 16 && jwtAfterPrimary.length >= 16) {
    process.env.JWT_SECRET = jwtAfterPrimary;
    console.warn(
      `[issue-dev-jwt] ${envFilePath} has empty or short JWT_SECRET (typical after vercel env pull). Using JWT_SECRET from the prior load (e.g. .env or injected env). For Production-only mint without .env, use: npm run jwt:dev:vercel`,
    );
  }
}

import { SignJWT } from "jose";

const secret = (process.env.JWT_SECRET ?? "").trim();
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
