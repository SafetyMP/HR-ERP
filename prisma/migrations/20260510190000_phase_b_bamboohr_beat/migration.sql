-- Phase B: in-house payroll close, benefits life events, interviews (Beat BambooHR+payroll goal).

CREATE TYPE "PayrollPeriodStatus" AS ENUM ('OPEN', 'COMPUTED', 'LOCKED', 'ARTIFACT_GENERATED');
CREATE TYPE "PayrollRunExceptionCode" AS ENUM ('NO_COMPENSATION', 'VALIDATION_ERROR', 'SKIPPED_EXISTING');
CREATE TYPE "PayrollRunExceptionStatus" AS ENUM ('OPEN', 'RESOLVED', 'WAIVED');

ALTER TABLE "payroll_periods"
  ADD COLUMN "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "locked_at" TIMESTAMP(3),
  ADD COLUMN "locked_by_subject_id" TEXT;

CREATE INDEX "payroll_periods_tenant_id_status_idx" ON "payroll_periods" ("tenant_id", "status");

CREATE TABLE "payroll_run_exceptions" (
  "id"                TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "payroll_period_id" TEXT NOT NULL,
  "employee_id"       TEXT NOT NULL,
  "code"              "PayrollRunExceptionCode" NOT NULL,
  "status"            "PayrollRunExceptionStatus" NOT NULL DEFAULT 'OPEN',
  "resolution_note"   TEXT,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payroll_run_exceptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_run_exceptions_payroll_period_id_fkey"
    FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods" ("id") ON DELETE CASCADE,
  CONSTRAINT "payroll_run_exceptions_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "payroll_run_exceptions_tenant_period_employee_code_key"
  ON "payroll_run_exceptions" ("tenant_id", "payroll_period_id", "employee_id", "code");
CREATE INDEX "payroll_run_exceptions_tenant_period_status_idx"
  ON "payroll_run_exceptions" ("tenant_id", "payroll_period_id", "status");

CREATE TABLE "payroll_filing_artifacts" (
  "id"                TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "payroll_period_id" TEXT NOT NULL,
  "jurisdiction"      TEXT NOT NULL,
  "version_id"        TEXT NOT NULL,
  "payload_hash"      TEXT NOT NULL,
  "payload_json"      JSONB NOT NULL,
  "generated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payroll_filing_artifacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_filing_artifacts_payroll_period_id_fkey"
    FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods" ("id") ON DELETE CASCADE
);
CREATE INDEX "payroll_filing_artifacts_tenant_period_idx"
  ON "payroll_filing_artifacts" ("tenant_id", "payroll_period_id");

CREATE TYPE "BenefitLifeEventType" AS ENUM ('MARRIAGE', 'BIRTH_ADOPTION', 'DIVORCE', 'LOSS_OF_COVERAGE', 'OTHER');
CREATE TYPE "BenefitLifeEventStatus" AS ENUM ('SUBMITTED', 'HR_REVIEW', 'APPLIED', 'DENIED');

CREATE TABLE "benefit_life_events" (
  "id"             TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "employee_id"    TEXT NOT NULL,
  "event_type"     "BenefitLifeEventType" NOT NULL,
  "event_date"     DATE NOT NULL,
  "description"    VARCHAR(2000),
  "status"         "BenefitLifeEventStatus" NOT NULL DEFAULT 'SUBMITTED',
  "hr_note"        VARCHAR(2000),
  "cobra_event_id" TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "benefit_life_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "benefit_life_events_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "benefit_life_events_cobra_event_id_key" ON "benefit_life_events" ("cobra_event_id");
CREATE INDEX "benefit_life_events_tenant_status_idx" ON "benefit_life_events" ("tenant_id", "status");
CREATE INDEX "benefit_life_events_tenant_employee_idx" ON "benefit_life_events" ("tenant_id", "employee_id");

CREATE TYPE "JobInterviewOutcome" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "job_interviews" (
  "id"             TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "application_id" TEXT NOT NULL,
  "scheduled_at"   TIMESTAMP(3) NOT NULL,
  "interview_type" TEXT NOT NULL,
  "outcome"        "JobInterviewOutcome" NOT NULL DEFAULT 'SCHEDULED',
  "scorecard_json" JSONB NOT NULL DEFAULT '{}',
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "job_interviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_interviews_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "job_applications" ("id") ON DELETE CASCADE
);
CREATE INDEX "job_interviews_tenant_application_idx" ON "job_interviews" ("tenant_id", "application_id");

-- RLS
ALTER TABLE "payroll_run_exceptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_run_exceptions" FORCE ROW LEVEL SECURITY;
CREATE POLICY payroll_run_exceptions_tenant_isolation ON "payroll_run_exceptions"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "payroll_filing_artifacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_filing_artifacts" FORCE ROW LEVEL SECURITY;
CREATE POLICY payroll_filing_artifacts_tenant_isolation ON "payroll_filing_artifacts"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "benefit_life_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benefit_life_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY benefit_life_events_tenant_isolation ON "benefit_life_events"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "job_interviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_interviews" FORCE ROW LEVEL SECURITY;
CREATE POLICY job_interviews_tenant_isolation ON "job_interviews"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
