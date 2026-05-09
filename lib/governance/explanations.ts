import { createHash } from "node:crypto";

import { z } from "zod";

export const explanationFactorSchema = z.object({
  label: z.string().min(1),
  direction: z.enum(["increases_score", "decreases_score", "neutral"]),
  detail: z.string().optional(),
});

export const explanationPayloadSchemaV1 = z.object({
  summary: z.string().min(1).max(4000),
  topFactors: z.array(explanationFactorSchema).min(1).max(20),
  modelVersion: z.string().optional(),
  uncertainty: z.string().optional(),
  limitations: z.string().optional(),
});

export type ExplanationPayloadV1 = z.infer<typeof explanationPayloadSchemaV1>;

export const EXPLANATION_SCHEMA_V1 = "governance.explanation.v1";

export function hashExplanationPayload(payload: unknown): string {
  const canonical = JSON.stringify(payload);
  return createHash("sha256").update(canonical).digest("hex");
}

export function parseExplanationPayloadV1(raw: unknown): ExplanationPayloadV1 {
  return explanationPayloadSchemaV1.parse(raw);
}
