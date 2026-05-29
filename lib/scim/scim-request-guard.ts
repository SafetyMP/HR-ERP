import { requireScimBinding, type ScimTenantBinding } from "@/lib/scim/auth";
import {
  assertScimRateLimit,
  scimRateLimitHeaders,
} from "@/lib/scim/rate-limit";

export function guardScimRequest(request: Request): {
  binding: ScimTenantBinding;
  rateLimitHeaders: Record<string, string>;
} {
  const binding = requireScimBinding(request);
  assertScimRateLimit(binding.tenantId);
  return { binding, rateLimitHeaders: scimRateLimitHeaders(binding.tenantId) };
}
