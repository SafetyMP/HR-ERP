/**
 * Hermetic adversarial probes — import production gates (no live network attacks).
 * Includes Core HR domain negatives (R-009/R-015/R-018). Run via: ./scripts/adversarial.sh
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

import { demoPreviewSignInServerEnabled } from "../lib/auth/demo-preview";
import {
  CORE_HR_MAX_BODY_BYTES,
  readJsonBytesLimited,
} from "../lib/api/v1/read-json-limited";
import { assertSafeDeliveryUrl } from "../lib/integrations/http/assert-safe-delivery-url";
import { assertProductionJwtIssuerMode } from "../lib/security/assert-production-jwt-mode";
import { getRoutePolicy } from "../lib/security/route-policies";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function withEnv(
  patch: Record<string, string | undefined>,
  fn: () => void,
): void {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(patch)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

function probeHs256(): void {
  withEnv(
    {
      NODE_ENV: "production",
      VERCEL_ENV: undefined,
      JWT_ISSUER_MODE: "hs256",
      ALLOW_HS256_IN_PRODUCTION: undefined,
    },
    () => {
      let threw = false;
      try {
        assertProductionJwtIssuerMode();
      } catch {
        threw = true;
      }
      assert(
        threw,
        "assertProductionJwtIssuerMode should throw for HS256 in production",
      );
    },
  );

  const dockerfile = readFileSync(join(process.cwd(), "Dockerfile"), "utf8");
  const active = dockerfile
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");
  assert(
    !/ALLOW_HS256_IN_PRODUCTION\s*=\s*1/.test(active),
    "Dockerfile must not bake ALLOW_HS256_IN_PRODUCTION=1",
  );
  console.log("  ok  HS256 production gate + Dockerfile");
}

function probeSsrf(): void {
  const reject = [
    "http://example.com/hook",
    "https://127.0.0.1/hook",
    "https://localhost/hook",
    "https://169.254.169.254/latest/meta-data",
    "https://10.0.0.1/hook",
    "https://[::ffff:10.0.0.1]/hook",
  ];
  for (const url of reject) {
    let threw = false;
    try {
      assertSafeDeliveryUrl(url);
    } catch {
      threw = true;
    }
    assert(threw, `assertSafeDeliveryUrl should reject ${url}`);
  }
  const ok = assertSafeDeliveryUrl("https://example.com/hooks/partner");
  assert(ok.hostname === "example.com", "public HTTPS host should be accepted");
  console.log("  ok  SSRF assertSafeDeliveryUrl");
}

function probeDemoPreview(): void {
  withEnv(
    {
      NODE_ENV: "production",
      VERCEL_ENV: undefined,
      ALLOW_DEMO_PREVIEW_SIGNIN: undefined,
      ALLOW_DEMO_PREVIEW_ON_PRODUCTION: undefined,
      DISABLE_DEMO_PREVIEW_SIGNIN: undefined,
    },
    () => {
      assert(
        demoPreviewSignInServerEnabled() === false,
        "demo preview must be off for production-like env without dual flags",
      );
    },
  );
  console.log("  ok  demo-preview dual gate");
}

async function probeCoreHrDomain(): Promise<void> {
  // R-009 — body over 16 KiB rejected before parse
  const oversized = "x".repeat(CORE_HR_MAX_BODY_BYTES + 8);
  const bigReq = new Request("http://local/api/v1/departments", {
    method: "POST",
    headers: { "content-length": String(oversized.length) },
    body: oversized,
  });
  let bodyThrew = false;
  try {
    await readJsonBytesLimited(bigReq);
  } catch {
    bodyThrew = true;
  }
  assert(bodyThrew, "Core HR write body >16KiB must reject (R-009)");

  // R-007 — unknown fields rejected (closed schema)
  const Closed = z
    .object({
      name: z.string(),
      code: z.string(),
    })
    .strict();
  const unk = Closed.safeParse({ name: "X", code: "Y", salary: 1 });
  assert(!unk.success, "closed Core HR schema must reject unknown fields");

  // R-011 — no hard-delete route policies for Core HR resources
  assert(
    getRoutePolicy("DELETE", "/api/v1/employees") === undefined,
    "no DELETE /employees policy",
  );
  assert(
    getRoutePolicy("DELETE", "/api/v1/departments") === undefined,
    "no DELETE /departments policy",
  );
  assert(
    getRoutePolicy("DELETE", "/api/v1/job-roles") === undefined,
    "no DELETE /job-roles policy",
  );

  // R-008 — Core HR write routes registered (deny-by-default otherwise)
  assert(
    getRoutePolicy("POST", "/api/v1/departments")?.permission === "departments:write",
    "departments POST policy required",
  );
  assert(
    getRoutePolicy("POST", "/api/v1/employees")?.permission === "employees:write",
    "employees POST policy required",
  );

  // R-018 — local HS256 success is not production JWT posture (platform gate)
  console.log(
    "  ok  Core HR domain negatives (R-009/R-007/R-011/R-008); HS256 demo ≠ production JWT (R-018)",
  );
}

async function main(): Promise<void> {
  console.log("== adversarial probes ==");
  probeHs256();
  probeSsrf();
  probeDemoPreview();
  await probeCoreHrDomain();
  console.log("adversarial: ok (hermetic probes + Core HR domain)");
}

main().catch((err) => {
  console.error("adversarial: FAIL", err);
  process.exit(1);
});
