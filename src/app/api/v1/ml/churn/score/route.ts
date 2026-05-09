import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRoute } from "@/lib/api/v1/http";
import { requireBearerAuth } from "@/lib/security/request-auth";
import { getRoutePolicy } from "@/lib/security/route-policies";
import {
  assertAbac,
  assertPermission,
  assertTenantScopedSubject,
} from "@/lib/security/policy-engine";

const ML_SERVING_URL =
  process.env.ML_SERVING_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8090";

export async function POST(request: Request) {
  const auth = await requireBearerAuth(request);

  return safeRoute(auth.correlationId, async () => {
    const policy = getRoutePolicy("POST", "/api/v1/ml/churn/score");
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertTenantScopedSubject(auth);
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");
    if (!auth.roles.some((r) => r === "hr_admin" || r === "manager")) {
      throw new ApiError(403, { code: "forbidden", message: "role_denied" });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, {
        code: "bad_request",
        message: "invalid_json",
      });
    }
    const rec = body as Record<string, unknown>;
    const features = rec.features;
    if (!features || typeof features !== "object") {
      throw new ApiError(400, {
        code: "validation_error",
        message: "features_object_required",
      });
    }

    const res = await fetch(`${ML_SERVING_URL}/v1/churn/score`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ features }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(502, {
        code: "ml_upstream_error",
        message: text.slice(0, 500),
      });
    }
    const scored = (await res.json()) as unknown;
    return jsonV1({ result: scored }, auth.correlationId);
  });
}
