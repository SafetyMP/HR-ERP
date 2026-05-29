import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import {
  listIntegrationInstances,
  upsertIntegrationInstance,
} from "@/lib/integrations/instances-service";
import { z } from "zod";

const UpsertSchema = z.object({
  vendorKey: z.string().min(1).max(64),
  config: z.record(z.string(), z.unknown()).optional(),
  webhookSecret: z.string().min(32).max(256).optional(),
});

export const GET = defineV1Route({
  method: "GET",
  pathname: "/api/v1/integrations/instances",
  classification: "confidential",
  handler: async ({ auth }) => {
    const instances = await listIntegrationInstances(auth);
    return { instances };
  },
});

export const PUT = defineV1Route({
  method: "PUT",
  pathname: "/api/v1/integrations/instances",
  classification: "confidential",
  bodySchema: UpsertSchema,
  handler: async ({ auth, body }) => {
    const instance = await upsertIntegrationInstance(auth, body);
    return { instance };
  },
});
