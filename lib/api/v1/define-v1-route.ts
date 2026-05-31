import type { NextResponse } from "next/server";
import type { V1ErrorBody } from "@/lib/api/v1/http";
import type { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth, type V1SuccessBody } from "@/lib/api/v1/http";
import { logEssRouteTiming } from "@/lib/api/v1/route-timing";
import { parseJsonBody } from "@/lib/api/v1/json-body";
import type { AuthContext } from "@/lib/security/auth-context";
import type { DataClassification } from "@/lib/security/abac-attributes";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

type HttpVerb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface DefineV1RouteConfig<TData, TBody = undefined> {
  method: HttpVerb;
  /** Pathname from `new URL(request.url).pathname` */
  pathname: string;
  classification?: DataClassification;
  bodySchema?: z.ZodType<TBody>;
  handler: (
    ctx: {
      auth: AuthContext;
      request: Request;
      body: TBody;
    },
  ) => Promise<TData>;
}

function resolvePolicy(method: HttpVerb, pathname: string) {
  const policy = getRoutePolicy(method, pathname);
  if (!policy) {
    throw new ApiError(404, {
      code: "not_found",
      message: "route_policy_missing",
    });
  }
  return policy;
}

export function defineV1Route<TData, TBody = undefined>(
  config: DefineV1RouteConfig<TData, TBody>,
): (
  request: Request,
) => Promise<NextResponse<V1SuccessBody<TData> | V1ErrorBody>> {
  return (request: Request) =>
    safeRouteAuth(request, async (auth) => {
      const policy = resolvePolicy(config.method, config.pathname);
      assertPermission(auth, policy.permission);
      assertAbac(auth, policy.abac, config.classification ?? "internal");

      let body = undefined as TBody;
      if (config.bodySchema) {
        body = await parseJsonBody(request, config.bodySchema);
      }

      const started = performance.now();
      const data = await config.handler({ auth, request, body });
      logEssRouteTiming(config.pathname, performance.now() - started, auth.correlationId);
      return jsonV1(data, auth.correlationId);
    });
}
