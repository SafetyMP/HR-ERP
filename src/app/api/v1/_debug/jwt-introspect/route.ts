/**
 * Temporary diagnostic route — `/api/v1/_debug/jwt-introspect`.
 *
 * Exists ONLY to break the bundler-vs-runtime JWT failure loop documented in
 * the post-mortem audit. Once the smoke goes green, delete this file along
 * with `scripts/jwt-debug-introspect.mjs` and the `JWT_DEBUG_TOKEN` env var
 * on Vercel + GitHub `production`. See
 * [`docs/operations/vercel-managed-phase1-environment.md`](../../../../../docs/operations/vercel-managed-phase1-environment.md).
 *
 * Gate: returns `404` (invisible to scanners) unless `JWT_DEBUG_TOKEN` env
 * var is set on the deployment AND the request `x-debug-token` header
 * matches it. Comparison is timing-safe.
 *
 * Method: `POST` only — `/api/v1/*` middleware demands a Bearer token, so
 * the introspect script always sends the freshly-minted JWT as Bearer (which
 * also doubles as the token to verify) plus `x-debug-token` for the gate.
 *
 * Returns: runtime context + the **actual `jose` error class** when verify
 * fails, so the next remediation step is data-driven instead of another
 * round of bundler-evasion patches.
 *
 * Never returns the raw `JWT_SECRET`. Only its SHA-256, length, and a
 * 4-char mask via `inspectJwtSecret()`.
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { API_VERSION } from "@/lib/backend/stack-manifest";
import { inspectJwtSecret, verifyHrJwt } from "@/lib/security/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function gateOpen(request: Request): boolean {
  const expected = (process.env.JWT_DEBUG_TOKEN ?? "").trim();
  if (expected.length < 16) return false;
  const provided = (request.headers.get("x-debug-token") ?? "").trim();
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, "utf-8"),
      Buffer.from(provided, "utf-8"),
    );
  } catch {
    return false;
  }
}

function notFound(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

async function buildRuntimeContext(): Promise<Record<string, unknown>> {
  const inspect = await inspectJwtSecret();
  return {
    vercel_env: process.env.VERCEL_ENV ?? null,
    vercel_region: process.env.VERCEL_REGION ?? null,
    vercel_deployment_id: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    vercel_url: process.env.VERCEL_URL ?? null,
    node_version: process.version,
    jwt_secret: inspect,
  };
}

export async function POST(request: Request) {
  if (!gateOpen(request)) return notFound();

  const runtime = await buildRuntimeContext();
  const auth = request.headers.get("authorization");

  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        apiVersion: API_VERSION,
        runtime,
        verify: { ok: false, reason: "missing_bearer_token" },
      },
      { status: 200 },
    );
  }

  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return NextResponse.json(
      {
        apiVersion: API_VERSION,
        runtime,
        verify: { ok: false, reason: "missing_bearer_token" },
      },
      { status: 200 },
    );
  }

  let verify: Record<string, unknown>;
  try {
    const claims = await verifyHrJwt(token);
    verify = {
      ok: true,
      sub: typeof claims.sub === "string" ? claims.sub : null,
      tenant_id: typeof claims.tenant_id === "string" ? claims.tenant_id : null,
      mfa_level: claims.mfa_level ?? null,
      exp: typeof claims.exp === "number" ? claims.exp : null,
      iat: typeof claims.iat === "number" ? claims.iat : null,
    };
  } catch (err) {
    const e = err as { name?: string; code?: string; message?: string };
    verify = {
      ok: false,
      jose_error_name: e?.name ?? "Unknown",
      jose_error_code: e?.code ?? null,
      jose_error_message: e?.message ?? null,
    };
  }

  return NextResponse.json(
    { apiVersion: API_VERSION, runtime, verify },
    { status: 200 },
  );
}
