-- Phase 2 performance + compensation cycle scaffolding. Each table is RLS-isolated
-- by tenant_id, set per-transaction via app.tenant_id (see lib/security/with-authorized-transaction).

CREATE TYPE "PerformanceCycleStatus" AS ENUM ('DRAFT', 'OPEN', 'CALIBRATION', 'CLOSED');
CREATE TYPE "PerformanceGoalStatus"  AS ENUM ('DRAFT', 'ACTIVE', 'AT_RISK', 'COMPLETE', 'CANCELLED');
CREATE TYPE "PerformanceReviewStatus" AS ENUM ('DRAFT', 'EMPLOYEE_SUBMITTED', 'MANAGER_SUBMITTED', 'CALIBRATED', 'RELEASED');
CREATE TYPE "CompensationCycleType"   AS ENUM ('MERIT', 'BONUS', 'EQUITY_GRANT');
CREATE TYPE "CompensationCycleStatus" AS ENUM ('DRAFT', 'OPEN', 'REVIEW', 'APPROVED', 'APPLIED', 'CLOSED');
CREATE TYPE "CompensationRecommendationStatus" AS ENUM ('DRAFT', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED', 'APPLIED');

CREATE TABLE "performance_cycles" (
  "id"               TEXT NOT NULL,
  "tenant_id"        TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "start_date"       DATE NOT NULL,
  "end_date"         DATE NOT NULL,
  "status"           "PerformanceCycleStatus" NOT NULL DEFAULT 'DRAFT',
  "rating_scale_max" INTEGER NOT NULL DEFAULT 5,
  "closed_at"        TIMESTAMP(3),
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "performance_cycles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "performance_cycles_tenant_id_status_idx" ON "performance_cycles" ("tenant_id", "status");

CREATE TABLE "performance_goals" (
  "id"                  TEXT NOT NULL,
  "tenant_id"           TEXT NOT NULL,
  "cycle_id"            TEXT NOT NULL,
  "employee_id"         TEXT NOT NULL,
  "title"               TEXT NOT NULL,
  "description"         TEXT,
  "weight_bp"           INTEGER NOT NULL DEFAULT 0,
  "status"              "PerformanceGoalStatus" NOT NULL DEFAULT 'DRAFT',
  "percent_complete_bp" INTEGER NOT NULL DEFAULT 0,
  "due_date"            DATE,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "performance_goals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "performance_goals_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "performance_cycles" ("id") ON DELETE CASCADE
);
CREATE INDEX "performance_goals_tenant_id_employee_id_cycle_id_idx" ON "performance_goals" ("tenant_id", "employee_id", "cycle_id");
CREATE INDEX "performance_goals_tenant_id_status_idx" ON "performance_goals" ("tenant_id", "status");

CREATE TABLE "performance_reviews_v2" (
  "id"                   TEXT NOT NULL,
  "tenant_id"            TEXT NOT NULL,
  "cycle_id"             TEXT NOT NULL,
  "employee_id"          TEXT NOT NULL,
  "manager_subject_id"   TEXT,
  "status"               "PerformanceReviewStatus" NOT NULL DEFAULT 'DRAFT',
  "self_rating"          INTEGER,
  "manager_rating"       INTEGER,
  "calibration_box"      INTEGER,
  "released_at"          TIMESTAMP(3),
  "manager_note"         TEXT,
  "self_note"            TEXT,
  "deleted_at"           TIMESTAMP(3),
  "retention_expires_at" TIMESTAMP(3),
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "performance_reviews_v2_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "performance_reviews_v2_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "performance_cycles" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "performance_reviews_v2_tenant_cycle_employee_key"
  ON "performance_reviews_v2" ("tenant_id", "cycle_id", "employee_id");
CREATE INDEX "performance_reviews_v2_tenant_id_status_idx" ON "performance_reviews_v2" ("tenant_id", "status");
CREATE INDEX "performance_reviews_v2_retention_expires_at_idx"
  ON "performance_reviews_v2" ("retention_expires_at")
  WHERE "deleted_at" IS NOT NULL;

CREATE TABLE "compensation_cycles" (
  "id"             TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "cycle_type"     "CompensationCycleType" NOT NULL,
  "effective_date" DATE NOT NULL,
  "status"         "CompensationCycleStatus" NOT NULL DEFAULT 'DRAFT',
  "currency_code"  TEXT NOT NULL,
  "closed_at"      TIMESTAMP(3),
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "compensation_cycles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "compensation_cycles_tenant_id_status_idx" ON "compensation_cycles" ("tenant_id", "status");

CREATE TABLE "compensation_recommendations" (
  "id"                          TEXT NOT NULL,
  "tenant_id"                   TEXT NOT NULL,
  "cycle_id"                    TEXT NOT NULL,
  "employee_id"                 TEXT NOT NULL,
  "status"                      "CompensationRecommendationStatus" NOT NULL DEFAULT 'DRAFT',
  "base_increase_amount_minor"  BIGINT,
  "bonus_amount_minor"          BIGINT,
  "equity_grant_shares"         BIGINT,
  "justification"               TEXT,
  "authorizing_proposal_id"     TEXT,
  "applied_at"                  TIMESTAMP(3),
  "created_at"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"                  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "compensation_recommendations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "compensation_recommendations_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "compensation_cycles" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "compensation_recommendations_tenant_cycle_employee_key"
  ON "compensation_recommendations" ("tenant_id", "cycle_id", "employee_id");
CREATE INDEX "compensation_recommendations_tenant_id_status_idx"
  ON "compensation_recommendations" ("tenant_id", "status");

-- RLS for all five tables.
ALTER TABLE "performance_cycles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "performance_cycles" FORCE ROW LEVEL SECURITY;
CREATE POLICY performance_cycles_tenant_isolation ON "performance_cycles"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "performance_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "performance_goals" FORCE ROW LEVEL SECURITY;
CREATE POLICY performance_goals_tenant_isolation ON "performance_goals"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "performance_reviews_v2" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "performance_reviews_v2" FORCE ROW LEVEL SECURITY;
CREATE POLICY performance_reviews_v2_tenant_isolation ON "performance_reviews_v2"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "compensation_cycles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compensation_cycles" FORCE ROW LEVEL SECURITY;
CREATE POLICY compensation_cycles_tenant_isolation ON "compensation_cycles"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "compensation_recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compensation_recommendations" FORCE ROW LEVEL SECURITY;
CREATE POLICY compensation_recommendations_tenant_isolation ON "compensation_recommendations"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
