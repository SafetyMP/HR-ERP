import { ApiError } from "@/lib/api/v1/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

const ENPS_MIN_BUCKET = 5;

export function classifyEnps(score: number): "promoter" | "passive" | "detractor" {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

/**
 * Compute eNPS = %promoters − %detractors. Scores must be the *full set* of
 * {0..10} responses for the survey/subset under analysis. Returns null when
 * the bucket is below `ENPS_MIN_BUCKET` to enforce anonymity guarantees.
 */
export function computeEnps(scores: number[]): { enps: number; bucketSize: number } | null {
  if (scores.length < ENPS_MIN_BUCKET) return null;
  let promoters = 0;
  let detractors = 0;
  for (const s of scores) {
    if (s < 0 || s > 10 || !Number.isInteger(s)) {
      throw new Error("eNPS scores must be integers in [0, 10]");
    }
    const bucket = classifyEnps(s);
    if (bucket === "promoter") promoters += 1;
    else if (bucket === "detractor") detractors += 1;
  }
  const enps = Math.round(((promoters - detractors) / scores.length) * 100);
  return { enps, bucketSize: scores.length };
}

export interface CreateSurveyInput {
  kind: "ENPS" | "PULSE" | "ANNUAL" | "CUSTOM";
  title: string;
  description?: string | null;
  anonymize?: boolean;
}

export async function createSurvey(auth: AuthContext, input: CreateSurveyInput) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "engagement:survey_write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const survey = await tx.engagementSurvey.create({
        data: {
          tenantId: auth.tenantId,
          kind: input.kind,
          title: input.title.trim(),
          description: input.description ?? null,
          anonymize: input.anonymize ?? true,
          status: "DRAFT",
        },
      });
      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.core_hr",
        eventType: "engagement.survey.created",
        correlationId: auth.correlationId,
        payload: { surveyId: survey.id, kind: survey.kind },
      });
      return survey;
    },
  );
}

export interface SubmitResponseInput {
  surveyId: string;
  score: number;
  comment?: string | null;
}

export async function submitResponse(
  auth: AuthContext,
  input: SubmitResponseInput,
) {
  if (
    !Number.isInteger(input.score) ||
    input.score < 0 ||
    input.score > 10
  ) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "score must be an integer in [0, 10]",
    });
  }
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "engagement:response_submit",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const survey = await tx.engagementSurvey.findFirst({
        where: { id: input.surveyId, tenantId: auth.tenantId },
      });
      if (!survey) {
        throw new ApiError(404, {
          code: "not_found",
          message: "engagement_survey_not_found",
        });
      }
      if (survey.status !== "OPEN") {
        throw new ApiError(409, {
          code: "survey_not_open",
          message: `survey is ${survey.status}`,
        });
      }

      const response = await tx.engagementResponse.upsert({
        where: {
          tenantId_surveyId_employeeId: {
            tenantId: auth.tenantId,
            surveyId: survey.id,
            employeeId: auth.subjectId,
          },
        },
        update: {
          score: input.score,
          comment: input.comment ?? null,
          submittedAt: new Date(),
        },
        create: {
          tenantId: auth.tenantId,
          surveyId: survey.id,
          employeeId: auth.subjectId,
          score: input.score,
          comment: input.comment ?? null,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.core_hr",
        eventType: "engagement.response.submitted",
        correlationId: auth.correlationId,
        payload: {
          surveyId: survey.id,
          responseId: response.id,
          // Never include employeeId in the event when survey is anonymized.
          ...(survey.anonymize ? {} : { employeeId: auth.subjectId }),
        },
      });
      return response;
    },
  );
}
