import { describe, expect, it } from "vitest";

import { sanitizeIntegrationJobPayloadForDlq } from "@/lib/integrations/dlq/write-dlq";
import { JOB_TYPES, VENDOR_KEYS } from "@/lib/integrations/constants";

describe("sanitizeIntegrationJobPayloadForDlq", () => {
  it("retains identifier fields and drops vendor person payloads", () => {
    const payload = {
      correlationId: "corr-1",
      tenantId: "tenant-a",
      vendorKey: VENDOR_KEYS.DEMO,
      jobType: JOB_TYPES.WEBHOOK_PROCESS,
      data: {
        integrationId: "int-1",
        email: "person@example.com",
        firstName: "Ada",
        nested: { ssn: "123-45-6789" },
      },
    };

    expect(sanitizeIntegrationJobPayloadForDlq(payload)).toEqual({
      ...payload,
      data: { integrationId: "int-1" },
    });
  });
});
