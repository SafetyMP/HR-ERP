import type { Prisma } from "@/app/generated/prisma/client";

export function integrationOutboxPayload(parts: {
  correlationId: string;
  vendorKey: string;
  data?: Prisma.InputJsonValue;
}): Prisma.InputJsonValue {
  return {
    correlationId: parts.correlationId,
    vendorKey: parts.vendorKey,
    data: parts.data ?? {},
  };
}
