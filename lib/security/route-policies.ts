import type { AbacConstraints } from "@/lib/security/abac-attributes";
import type { Permission } from "@/lib/security/permissions";

export interface RoutePolicy {
  permission: Permission;
  abac?: AbacConstraints;
}

type HttpVerb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function routeKey(method: HttpVerb, pathname: string): string {
  return `${method} ${pathname}`;
}

/** Central registry: every versioned API route must have an explicit policy entry (deny-by-default via absence). */
const ROUTES: Record<string, RoutePolicy> = {
  [routeKey("GET", "/api/v1/employees")]: {
    permission: "employees:list",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/employees/:employeeId")]: {
    permission: "employees:read",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/attendance/clock-in")]: {
    permission: "attendance:clock",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/analytics/churn")]: {
    permission: "analytics:churn:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/analytics/skills/match")]: {
    permission: "analytics:skills:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/analytics/benchmarks")]: {
    permission: "analytics:benchmarks:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/ml/churn/score")]: {
    permission: "analytics:churn:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
};

export function getRoutePolicy(
  method: string,
  pathname: string,
): RoutePolicy | undefined {
  const verb = method as HttpVerb;
  const exact = ROUTES[routeKey(verb, pathname)];
  if (exact) return exact;

  if (
    verb === "GET" &&
    /^\/api\/v1\/employees\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      pathname,
    )
  ) {
    return ROUTES[routeKey("GET", "/api/v1/employees/:employeeId")];
  }

  return undefined;
}

export function registerRoutePolicy(
  method: HttpVerb,
  pathname: string,
  policy: RoutePolicy,
): void {
  ROUTES[routeKey(method, pathname)] = policy;
}

/** Introspection for CI / audits — stable sorted keys. */
export function listRegisteredRoutePolicies(): string[] {
  return Object.keys(ROUTES).sort();
}
