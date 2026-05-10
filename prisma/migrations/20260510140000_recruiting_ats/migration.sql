-- Phase 2 ATS / Recruiting tables. Each tenant_id is enforced via RLS so that
-- requisitions, candidates, applications, and offers are isolated even if a
-- caller forgets the tenant filter in application code.

CREATE TYPE "JobRequisitionStatus" AS ENUM ('DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED', 'FILLED');
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMP');
CREATE TYPE "CandidateSourceChannel" AS ENUM ('CAREERS_SITE', 'EMPLOYEE_REFERRAL', 'AGENCY', 'LINKEDIN', 'JOB_BOARD', 'EVENT', 'OTHER');
CREATE TYPE "JobApplicationStage" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "JobOfferStatus" AS ENUM ('DRAFT', 'PENDING_HITL_APPROVAL', 'EXTENDED', 'ACCEPTED', 'DECLINED', 'RESCINDED', 'EXPIRED');

CREATE TABLE "job_requisitions" (
  "id"                TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "title"             TEXT NOT NULL,
  "department_id"     TEXT,
  "job_role_id"       TEXT,
  "hiring_manager_id" TEXT,
  "status"            "JobRequisitionStatus" NOT NULL DEFAULT 'DRAFT',
  "openings"          INTEGER NOT NULL DEFAULT 1,
  "location_country"  TEXT,
  "employment_type"   "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
  "description"       TEXT,
  "closed_at"         TIMESTAMP(3),
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "job_requisitions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "job_requisitions_tenant_id_status_idx" ON "job_requisitions" ("tenant_id", "status");
CREATE INDEX "job_requisitions_tenant_id_hiring_manager_id_idx" ON "job_requisitions" ("tenant_id", "hiring_manager_id");

CREATE TABLE "candidates" (
  "id"                   TEXT NOT NULL,
  "tenant_id"            TEXT NOT NULL,
  "full_name"            TEXT NOT NULL,
  "email"                TEXT NOT NULL,
  "phone"                TEXT,
  "source_channel"       "CandidateSourceChannel" NOT NULL DEFAULT 'CAREERS_SITE',
  "anonymized_pseudonym" TEXT,
  "deleted_at"           TIMESTAMP(3),
  "retention_expires_at" TIMESTAMP(3),
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "candidates_tenant_id_email_key" ON "candidates" ("tenant_id", "email");
CREATE INDEX "candidates_tenant_id_idx" ON "candidates" ("tenant_id");
CREATE INDEX "candidates_retention_expires_at_idx"
  ON "candidates" ("retention_expires_at")
  WHERE "deleted_at" IS NOT NULL;

CREATE TABLE "job_applications" (
  "id"                            TEXT NOT NULL,
  "tenant_id"                     TEXT NOT NULL,
  "requisition_id"                TEXT NOT NULL,
  "candidate_id"                  TEXT NOT NULL,
  "stage"                         "JobApplicationStage" NOT NULL DEFAULT 'APPLIED',
  "latest_screening_proposal_id"  TEXT,
  "note"                          TEXT,
  "applied_at"                    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rejected_at"                   TIMESTAMP(3),
  "hired_at"                      TIMESTAMP(3),
  "created_at"                    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"                    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_applications_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "job_requisitions" ("id") ON DELETE CASCADE,
  CONSTRAINT "job_applications_candidate_id_fkey"   FOREIGN KEY ("candidate_id")   REFERENCES "candidates"       ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "job_applications_tenant_id_requisition_id_candidate_id_key"
  ON "job_applications" ("tenant_id", "requisition_id", "candidate_id");
CREATE INDEX "job_applications_tenant_id_stage_idx" ON "job_applications" ("tenant_id", "stage");

CREATE TABLE "job_offers" (
  "id"                          TEXT NOT NULL,
  "tenant_id"                   TEXT NOT NULL,
  "application_id"              TEXT NOT NULL,
  "authorizing_proposal_id"     TEXT,
  "status"                      "JobOfferStatus" NOT NULL DEFAULT 'DRAFT',
  "base_annual_amount_minor"    BIGINT NOT NULL,
  "currency_code"               TEXT NOT NULL,
  "start_date"                  DATE,
  "expires_at"                  TIMESTAMP(3),
  "accepted_at"                 TIMESTAMP(3),
  "declined_at"                 TIMESTAMP(3),
  "rescinded_at"                TIMESTAMP(3),
  "deleted_at"                  TIMESTAMP(3),
  "retention_expires_at"        TIMESTAMP(3),
  "created_at"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"                  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "job_offers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_offers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications" ("id") ON DELETE CASCADE
);
CREATE INDEX "job_offers_tenant_id_status_idx" ON "job_offers" ("tenant_id", "status");
CREATE INDEX "job_offers_tenant_id_application_id_idx" ON "job_offers" ("tenant_id", "application_id");
CREATE INDEX "job_offers_retention_expires_at_idx"
  ON "job_offers" ("retention_expires_at")
  WHERE "deleted_at" IS NOT NULL;

-- Enable RLS on all four tables. tenant_id is the policy predicate, set by
-- application code via SELECT set_config('app.tenant_id', ..., true).

ALTER TABLE "job_requisitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_requisitions" FORCE ROW LEVEL SECURITY;
CREATE POLICY job_requisitions_tenant_isolation ON "job_requisitions"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "candidates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "candidates" FORCE ROW LEVEL SECURITY;
CREATE POLICY candidates_tenant_isolation ON "candidates"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "job_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_applications" FORCE ROW LEVEL SECURITY;
CREATE POLICY job_applications_tenant_isolation ON "job_applications"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "job_offers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_offers" FORCE ROW LEVEL SECURITY;
CREATE POLICY job_offers_tenant_isolation ON "job_offers"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
