#!/usr/bin/env node
/**
 * Mint access JWT via deployed `POST /api/auth/token` (Vercel / any hosted URL).
 * The access token is signed with the deployment’s `JWT_SECRET` — no local `JWT_SECRET` match required.
 *
 *   npm run jwt:production
 *
 * Required in `.env`:
 *   HR_ERP_BEARER_ISSUER_SECRET — min 32 chars; must match the value on the deployment.
 *   HR_ERP_MINT_BASE_URL — e.g. `https://your-app.vercel.app` (no trailing slash).
 *
 * Optional: same `DEV_*` / `DEMO_*` env vars as `jwt:dev`, plus
 *   JWT_PRODUCTION_EXPIRES_SECONDS (default 3600, max 7200 on server).
 *
 * Do not expose `HR_ERP_BEARER_ISSUER_SECRET` in browsers or client bundles.
 */
import "dotenv/config";

function normalizeBase(raw) {
  if (!raw) return "";
  let s = raw.trim().replace(/\/$/, "");
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }
  return s;
}

const issuer = process.env.HR_ERP_BEARER_ISSUER_SECRET;
const base = normalizeBase(
  process.env.HR_ERP_MINT_BASE_URL || process.env.VERCEL_URL || "",
);

if (!issuer || issuer.length < 32) {
  console.error(
    "HR_ERP_BEARER_ISSUER_SECRET must be set (min 32 chars). Same value as on the deployment.",
  );
  process.exit(1);
}

if (!base) {
  console.error(
    "Set HR_ERP_MINT_BASE_URL to your app origin, e.g. https://your-app.vercel.app",
  );
  process.exit(1);
}

const tenantId =
  process.env.DEV_TENANT_ID?.trim() ||
  process.env.DEMO_TENANT_ID?.trim() ||
  "default-tenant";

const sub =
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

const omitSubjectEmployeeId =
  process.env.DEV_OMIT_SUBJECT_EMPLOYEE_ID === "1" ||
  process.env.DEV_OMIT_SUBJECT_EMPLOYEE_ID === "true";

const expiresRaw = process.env.JWT_PRODUCTION_EXPIRES_SECONDS;
const expiresInSeconds = (() => {
  const n = expiresRaw != null && expiresRaw !== "" ? Number(expiresRaw) : 3600;
  return Number.isFinite(n) ? Math.min(7200, Math.max(300, Math.trunc(n))) : 3600;
})();

/** @type {Record<string, unknown>} */
const body = {
  sub,
  tenantId,
  roles,
  expiresInSeconds,
};

if (omitSubjectEmployeeId) {
  body.omitSubjectEmployeeId = true;
} else {
  body.subjectEmployeeId = subjectEmployeeId;
}

const url = `${base}/api/auth/token`;

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${issuer}`,
  },
  body: JSON.stringify(body),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  console.error(`HTTP ${res.status} — non-JSON:`, text.slice(0, 500));
  process.exit(1);
}

if (!res.ok) {
  console.error(json);
  process.exit(1);
}

const token = json.access_token;
if (typeof token !== "string" || !token) {
  console.error("No access_token in response:", json);
  process.exit(1);
}

console.warn(
  `[jwt:production] minted via ${url} tenant=${tenantId} roles=${roles.join(",")}${omitSubjectEmployeeId ? "" : ` subject_employee_id=${subjectEmployeeId}`} expires_in=${json.expires_in}s → paste next line (Authorization: Bearer … / Profile dev)`,
);

console.log(token);
