-- Phase 3 — position management + engagement / eNPS scaffolding.

CREATE TYPE "PositionStatus" AS ENUM ('PROPOSED', 'APPROVED', 'ACTIVE', 'FROZEN', 'CLOSED');
CREATE TYPE "EngagementSurveyStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
CREATE TYPE "EngagementSurveyKind"   AS ENUM ('ENPS', 'PULSE', 'ANNUAL', 'CUSTOM');

CREATE TABLE "positions" (
  "id"                  TEXT NOT NULL,
  "tenant_id"           TEXT NOT NULL,
  "code"                TEXT NOT NULL,
  "title"               TEXT NOT NULL,
  "job_role_id"         TEXT,
  "department_id"       TEXT,
  "parent_position_id"  TEXT,
  "status"              "PositionStatus" NOT NULL DEFAULT 'PROPOSED',
  "headcount"           INTEGER NOT NULL DEFAULT 1,
  "fte_basis_points"    INTEGER NOT NULL DEFAULT 10000,
  "effective_from"      DATE NOT NULL,
  "effective_to"        DATE,
  "closed_at"           TIMESTAMP(3),
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "positions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "positions_parent_position_id_fkey"
    FOREIGN KEY ("parent_position_id") REFERENCES "positions" ("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "positions_tenant_id_code_key"
  ON "positions" ("tenant_id", "code");
CREATE INDEX "positions_tenant_id_status_idx"
  ON "positions" ("tenant_id", "status");
CREATE INDEX "positions_tenant_id_parent_position_id_idx"
  ON "positions" ("tenant_id", "parent_position_id");

CREATE TABLE "engagement_surveys" (
  "id"          TEXT NOT NULL,
  "tenant_id"   TEXT NOT NULL,
  "kind"        "EngagementSurveyKind" NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "anonymize"   BOOLEAN NOT NULL DEFAULT TRUE,
  "status"      "EngagementSurveyStatus" NOT NULL DEFAULT 'DRAFT',
  "started_at"  TIMESTAMP(3),
  "closed_at"   TIMESTAMP(3),
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "engagement_surveys_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "engagement_surveys_tenant_id_status_idx"
  ON "engagement_surveys" ("tenant_id", "status");

CREATE TABLE "engagement_responses" (
  "id"           TEXT NOT NULL,
  "tenant_id"    TEXT NOT NULL,
  "survey_id"    TEXT NOT NULL,
  "employee_id"  TEXT NOT NULL,
  "score"        INTEGER NOT NULL,
  "comment"      TEXT,
  "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "engagement_responses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "engagement_responses_survey_id_fkey"
    FOREIGN KEY ("survey_id") REFERENCES "engagement_surveys" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "engagement_responses_tenant_survey_employee_key"
  ON "engagement_responses" ("tenant_id", "survey_id", "employee_id");
CREATE INDEX "engagement_responses_tenant_id_survey_id_idx"
  ON "engagement_responses" ("tenant_id", "survey_id");

ALTER TABLE "positions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "positions" FORCE ROW LEVEL SECURITY;
CREATE POLICY positions_tenant_isolation ON "positions"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "engagement_surveys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engagement_surveys" FORCE ROW LEVEL SECURITY;
CREATE POLICY engagement_surveys_tenant_isolation ON "engagement_surveys"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "engagement_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engagement_responses" FORCE ROW LEVEL SECURITY;
CREATE POLICY engagement_responses_tenant_isolation ON "engagement_responses"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
