import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

/** Schema for a workflow step blueprint stored in WorkflowDefinition.steps. */
export const WorkflowStepSchema = z.object({
  name: z.string().min(1).max(120),
  approverRoles: z.array(z.string().min(1)).min(1).max(10),
  slaHours: z.number().int().min(1).max(720).optional(),
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

export const WorkflowStepsSchema = z.array(WorkflowStepSchema).min(1).max(10);

export interface CreateWorkflowDefinitionInput {
  kind:
    | "TIME_OFF_APPROVAL"
    | "COMPENSATION_CHANGE"
    | "POSITION_CHANGE"
    | "TERMINATION"
    | "CUSTOM"
    | "COBRA_ELECTION"
    | "ONBOARDING"
    | "OFFBOARDING";
  code: string;
  name: string;
  description?: string | null;
  steps: WorkflowStep[];
}

export async function createWorkflowDefinition(
  auth: AuthContext,
  input: CreateWorkflowDefinitionInput,
) {
  const steps = WorkflowStepsSchema.parse(input.steps);
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "workflow:definition_write",
      resourceClassification: "internal",
    },
    async (tx) =>
      tx.workflowDefinition.create({
        data: {
          tenantId: auth.tenantId,
          kind: input.kind,
          code: input.code.trim(),
          name: input.name.trim(),
          description: input.description ?? null,
          steps,
        },
      }),
  );
}

export interface StartWorkflowInstanceInput {
  definitionCode: string;
  subjectType: string;
  subjectRef: string;
  context?: Record<string, unknown>;
}

export async function startWorkflowInstance(
  auth: AuthContext,
  input: StartWorkflowInstanceInput,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "workflow:instance_create",
      resourceClassification: "internal",
    },
    async (tx) => {
      const def = await tx.workflowDefinition.findFirst({
        where: {
          tenantId: auth.tenantId,
          code: input.definitionCode,
          isActive: true,
        },
      });
      if (!def) {
        throw new ApiError(404, {
          code: "not_found",
          message: "workflow_definition_not_found",
        });
      }
      const steps = WorkflowStepsSchema.parse(def.steps);
      const instance = await tx.workflowInstance.create({
        data: {
          tenantId: auth.tenantId,
          definitionId: def.id,
          initiatorSubjectId: auth.subjectId,
          subjectType: input.subjectType,
          subjectRef: input.subjectRef,
          context: (input.context ?? {}) as never,
          status: "ACTIVE",
          currentStepIndex: 0,
        },
      });

      const now = new Date();
      await tx.workflowStepInstance.createMany({
        data: steps.map((step, idx) => ({
          tenantId: auth.tenantId,
          instanceId: instance.id,
          stepIndex: idx,
          stepName: step.name,
          status: "PENDING",
          slaDueAt: step.slaHours
            ? new Date(now.getTime() + step.slaHours * 3_600_000)
            : null,
        })),
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.core_hr",
        eventType: "workflow.instance.started",
        correlationId: auth.correlationId,
        payload: {
          instanceId: instance.id,
          definitionCode: def.code,
          subjectType: input.subjectType,
          subjectRef: input.subjectRef,
        },
      });

      return instance;
    },
  );
}

export interface DecideStepInput {
  instanceId: string;
  decision: "APPROVED" | "REJECTED";
  note?: string | null;
}

/**
 * Apply a decision to the *current* PENDING step. Approving the last step
 * marks the instance COMPLETED; rejecting any step sets the instance to
 * REJECTED. Approver authorization happens via the workflow:instance_decide
 * permission and route ABAC; richer per-step role enforcement is left to a
 * future iteration once role-resolution is wired.
 */
export async function decideCurrentStep(
  auth: AuthContext,
  input: DecideStepInput,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "workflow:instance_decide",
      resourceClassification: "internal",
      prismaTx: { isolationLevel: "Serializable" },
    },
    async (tx) => {
      const instance = await tx.workflowInstance.findFirst({
        where: { id: input.instanceId, tenantId: auth.tenantId },
      });
      if (!instance) {
        throw new ApiError(404, {
          code: "not_found",
          message: "workflow_instance_not_found",
        });
      }
      if (instance.status !== "ACTIVE") {
        throw new ApiError(409, {
          code: "instance_not_active",
          message: `cannot decide on instance with status ${instance.status}`,
        });
      }
      const step = await tx.workflowStepInstance.findFirst({
        where: {
          tenantId: auth.tenantId,
          instanceId: instance.id,
          stepIndex: instance.currentStepIndex,
          status: "PENDING",
        },
      });
      if (!step) {
        throw new ApiError(409, {
          code: "no_pending_step",
          message: "no PENDING step found at currentStepIndex",
        });
      }

      const now = new Date();
      await tx.workflowStepInstance.update({
        where: { id: step.id },
        data: {
          status: input.decision,
          approverSubjectId: auth.subjectId,
          decisionNote: input.note ?? null,
          decidedAt: now,
        },
      });

      const def = await tx.workflowDefinition.findFirst({
        where: { id: instance.definitionId, tenantId: auth.tenantId },
      });
      const steps = def ? WorkflowStepsSchema.parse(def.steps) : [];
      const isLastStep = instance.currentStepIndex >= steps.length - 1;
      const nextStatus =
        input.decision === "REJECTED"
          ? "REJECTED"
          : isLastStep
            ? "COMPLETED"
            : "ACTIVE";
      const updated = await tx.workflowInstance.update({
        where: { id: instance.id },
        data: {
          status: nextStatus,
          currentStepIndex:
            input.decision === "APPROVED" && !isLastStep
              ? instance.currentStepIndex + 1
              : instance.currentStepIndex,
          completedAt:
            nextStatus === "COMPLETED" || nextStatus === "REJECTED" ? now : null,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.core_hr",
        eventType:
          nextStatus === "REJECTED"
            ? "workflow.instance.rejected"
            : nextStatus === "COMPLETED"
              ? "workflow.instance.completed"
              : "workflow.step.approved",
        correlationId: auth.correlationId,
        payload: {
          instanceId: instance.id,
          stepIndex: instance.currentStepIndex,
          decision: input.decision,
          subjectType: instance.subjectType,
          subjectRef: instance.subjectRef,
        },
      });

      return updated;
    },
  );
}
