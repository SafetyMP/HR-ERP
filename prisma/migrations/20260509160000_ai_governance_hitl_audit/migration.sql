-- AI governance: explanation snapshots, HITL proposals, append-only audit, high-stakes execution records.

CREATE TYPE "AiProposalStatus" AS ENUM (
  'PROPOSED',
  'AWAITING_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXECUTED'
);

CREATE TYPE "HighStakesActionType" AS ENUM (
  'HIRE',
  'TERMINATION',
  'COMPENSATION_CHANGE',
  'PIP_INITIATION',
  'OTHER'
);

CREATE TABLE "ai_explanation_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "content_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_explanation_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_explanation_snapshots_tenant_id_idx" ON "ai_explanation_snapshots"("tenant_id");

CREATE TABLE "ai_decision_proposals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_ref" TEXT NOT NULL,
    "proposed_action_type" "HighStakesActionType" NOT NULL,
    "status" "AiProposalStatus" NOT NULL DEFAULT 'PROPOSED',
    "model_version" TEXT,
    "dataset_snapshot_id" TEXT,
    "explanation_snapshot_id" TEXT NOT NULL,
    "proposed_by_subject_id" TEXT NOT NULL,
    "reviewed_by_subject_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "executed_by_subject_id" TEXT,
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_decision_proposals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_decision_proposals_explanation_snapshot_id_key" ON "ai_decision_proposals"("explanation_snapshot_id");

CREATE INDEX "ai_decision_proposals_tenant_id_status_idx" ON "ai_decision_proposals"("tenant_id", "status");

ALTER TABLE "ai_decision_proposals" ADD CONSTRAINT "ai_decision_proposals_explanation_snapshot_id_fkey" FOREIGN KEY ("explanation_snapshot_id") REFERENCES "ai_explanation_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "governance_audit_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_subject_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "correlation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "governance_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "governance_audit_events_tenant_id_created_at_idx" ON "governance_audit_events"("tenant_id", "created_at");

CREATE INDEX "governance_audit_events_entity_type_entity_id_idx" ON "governance_audit_events"("entity_type", "entity_id");

CREATE TABLE "high_stakes_employment_actions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "action_kind" "HighStakesActionType" NOT NULL,
    "performed_by_subject_id" TEXT NOT NULL,
    "external_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "high_stakes_employment_actions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "high_stakes_employment_actions_proposal_id_key" ON "high_stakes_employment_actions"("proposal_id");

CREATE INDEX "high_stakes_employment_actions_tenant_id_proposal_id_idx" ON "high_stakes_employment_actions"("tenant_id", "proposal_id");

ALTER TABLE "high_stakes_employment_actions" ADD CONSTRAINT "high_stakes_employment_actions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "ai_decision_proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ai_explanation_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_explanation_snapshots" FORCE ROW LEVEL SECURITY;

CREATE POLICY ai_explanation_snapshots_tenant_isolation ON "ai_explanation_snapshots"
FOR ALL
USING ("tenant_id" = current_setting('app.tenant_id', true))
WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "ai_decision_proposals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_decision_proposals" FORCE ROW LEVEL SECURITY;

CREATE POLICY ai_decision_proposals_tenant_isolation ON "ai_decision_proposals"
FOR ALL
USING ("tenant_id" = current_setting('app.tenant_id', true))
WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "governance_audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance_audit_events" FORCE ROW LEVEL SECURITY;

CREATE POLICY governance_audit_events_tenant_isolation ON "governance_audit_events"
FOR ALL
USING ("tenant_id" = current_setting('app.tenant_id', true))
WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "high_stakes_employment_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "high_stakes_employment_actions" FORCE ROW LEVEL SECURITY;

CREATE POLICY high_stakes_employment_actions_tenant_isolation ON "high_stakes_employment_actions"
FOR ALL
USING ("tenant_id" = current_setting('app.tenant_id', true))
WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));
