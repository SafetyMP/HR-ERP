/**
 * Hermetic adversarial probes — import production gates (no live network attacks).
 * Run via: ./scripts/adversarial.sh
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { demoPreviewSignInServerEnabled } from "../lib/auth/demo-preview";
import { assertSafeDeliveryUrl } from "../lib/integrations/http/assert-safe-delivery-url";
import { assertProductionJwtIssuerMode } from "../lib/security/assert-production-jwt-mode";

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

console.log("== adversarial probes ==");
probeHs256();
probeSsrf();
probeDemoPreview();
console.log("adversarial: ok (hermetic probes)");
