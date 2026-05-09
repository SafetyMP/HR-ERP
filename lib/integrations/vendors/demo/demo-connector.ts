import { z } from "zod";
import type { VendorConnector } from "@/lib/integrations/connector-types";
import { integrationFetchJson } from "@/lib/integrations/http/integration-fetch";
import { getVendorCircuitBreaker } from "@/lib/integrations/circuit-breaker";

export const DEMO_VENDOR_KEY = "demo";

const demoWebhookSchema = z.object({
  event: z.string(),
  person: z.object({
    id: z.union([z.string(), z.number()]).transform(String),
    email: z.string().email(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
  }),
});

export const demoPersonRemoteSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
});

/** Public read API used as a latency-friendly stand-in for a vendor HTTP API. */
const DEMO_REMOTE_USER_BASE = "https://jsonplaceholder.typicode.com/users";

export const demoConnector: VendorConnector = {
  vendorKey: DEMO_VENDOR_KEY,

  parseWebhookPayload(body: unknown): {
    eventType: string;
    rawPayload: Record<string, unknown>;
  } {
    const parsed = demoWebhookSchema.safeParse(body);
    if (!parsed.success) {
      throw new Error(`Demo webhook schema: ${parsed.error.message}`);
    }
    return {
      eventType: parsed.data.event,
      rawPayload: parsed.data as unknown as Record<string, unknown>,
    };
  },

  mapExternalPersonToEmployee(input: unknown): {
    email: string;
    firstName?: string;
    lastName?: string;
    externalId: string;
  } {
    const asWebhook = demoWebhookSchema.safeParse(input);
    if (asWebhook.success) {
      const { person } = asWebhook.data;
      return {
        externalId: person.id,
        email: person.email,
        firstName: person.first_name,
        lastName: person.last_name,
      };
    }

    const remote = demoPersonRemoteSchema.safeParse(input);
    if (!remote.success) {
      throw new Error(`Demo person mapping: ${remote.error.message}`);
    }

    const parts = remote.data.name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || undefined;

    return {
      externalId: String(remote.data.id),
      email: remote.data.email,
      firstName,
      lastName,
    };
  },
};

/** Outbound call with circuit breaker — external dependency is intentionally flaky-prone. */
export async function demoFetchPersonRemote(
  remoteUserId: number,
  correlationId?: string,
): Promise<z.infer<typeof demoPersonRemoteSchema>> {
  const cb = getVendorCircuitBreaker(DEMO_VENDOR_KEY);
  const url = `${DEMO_REMOTE_USER_BASE}/${remoteUserId}`;
  return cb.exec(() =>
    integrationFetchJson<unknown>(url, {
      correlationId,
      timeoutMs: 20_000,
    }).then((json) => demoPersonRemoteSchema.parse(json)),
  );
}
