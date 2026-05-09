-- Features 011–018 — manager leave decisions, HR case lifecycle, tax summaries, benefit intents,
-- punch correction proposals, onboarding templates, separation checklist, supporting schema.

ALTER TYPE "HrCaseStatus" ADD VALUE 'NEEDS_INFO';
ALTER TYPE "HrCaseStatus" ADD VALUE 'RESOLVED';

CREATE TYPE "BenefitElectionIntentStatus" AS ENUM ('SUBMITTED', 'CLOSED');
CREATE TYPE "TaxDocumentKind" AS ENUM ('W2_US_SUMMARY');
CREATE TYPE "AttendanceCorrectionStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

ALTER TABLE "time_off_requests"
  ADD COLUMN "decided_at" TIMESTAMP(3),
  ADD COLUMN "decided_by_employee_id" TEXT,
  ADD COLUMN "decision_note" TEXT;

ALTER TABLE "time_off_requests"
  ADD CONSTRAINT "time_off_requests_decided_by_employee_id_fkey"
  FOREIGN KEY ("decided_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "time_off_requests_tenant_id_status_idx" ON "time_off_requests"("tenant_id", "status");

ALTER TABLE "hr_case_requests" ADD COLUMN "employee_visible_note" TEXT;

CREATE TABLE "onboarding_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "onboarding_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "onboarding_templates_tenant_id_idx" ON "onboarding_templates"("tenant_id");

ALTER TABLE "onboarding_templates"
  ADD CONSTRAINT "onboarding_templates_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "onboarding_template_items" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "onboarding_template_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "onboarding_template_items_template_id_idx" ON "onboarding_template_items"("template_id");

ALTER TABLE "onboarding_template_items"
  ADD CONSTRAINT "onboarding_template_items_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "onboarding_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "tax_year_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "tax_year" INTEGER NOT NULL,
    "document_kind" "TaxDocumentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "availability_note" TEXT,
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tax_year_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tax_year_documents_tenant_id_employee_id_idx" ON "tax_year_documents"("tenant_id", "employee_id");

ALTER TABLE "tax_year_documents"
  ADD CONSTRAINT "tax_year_documents_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tax_year_documents"
  ADD CONSTRAINT "tax_year_documents_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "benefit_election_change_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "category" "BenefitCategory" NOT NULL,
    "summary" VARCHAR(2000) NOT NULL,
    "status" "BenefitElectionIntentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "benefit_election_change_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "benefit_election_change_requests_tenant_id_employee_id_idx"
  ON "benefit_election_change_requests"("tenant_id", "employee_id");

ALTER TABLE "benefit_election_change_requests"
  ADD CONSTRAINT "benefit_election_change_requests_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "benefit_election_change_requests"
  ADD CONSTRAINT "benefit_election_change_requests_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "attendance_correction_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "submitted_by_employee_id" TEXT NOT NULL,
    "punch_kind" "PunchKind" NOT NULL,
    "requested_occurred_at" TIMESTAMP(3) NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "status" "AttendanceCorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "decided_at" TIMESTAMP(3),
    "decided_by_employee_id" TEXT,
    "decision_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attendance_correction_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "attendance_correction_requests_tenant_id_employee_id_idx"
  ON "attendance_correction_requests"("tenant_id", "employee_id");

CREATE INDEX "attendance_correction_requests_tenant_id_submitted_by_employee_id_idx"
  ON "attendance_correction_requests"("tenant_id", "submitted_by_employee_id");

ALTER TABLE "attendance_correction_requests"
  ADD CONSTRAINT "attendance_correction_requests_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance_correction_requests"
  ADD CONSTRAINT "attendance_correction_requests_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_correction_requests"
  ADD CONSTRAINT "attendance_correction_requests_submitted_by_employee_id_fkey"
  FOREIGN KEY ("submitted_by_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance_correction_requests"
  ADD CONSTRAINT "attendance_correction_requests_decided_by_employee_id_fkey"
  FOREIGN KEY ("decided_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "employee_separation_tasks" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "employee_separation_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "employee_separation_tasks_employee_id_idx" ON "employee_separation_tasks"("employee_id");

ALTER TABLE "employee_separation_tasks"
  ADD CONSTRAINT "employee_separation_tasks_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "onboarding_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding_templates" FORCE ROW LEVEL SECURITY;

CREATE POLICY onboarding_templates_tenant_isolation ON onboarding_templates
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "onboarding_template_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding_template_items" FORCE ROW LEVEL SECURITY;

CREATE POLICY onboarding_template_items_tenant_isolation ON onboarding_template_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM onboarding_templates t
    WHERE t.id = onboarding_template_items.template_id
      AND t.tenant_id = current_setting('app.tenant_id', true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM onboarding_templates t
    WHERE t.id = onboarding_template_items.template_id
      AND t.tenant_id = current_setting('app.tenant_id', true)
  )
);

ALTER TABLE "tax_year_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tax_year_documents" FORCE ROW LEVEL SECURITY;

CREATE POLICY tax_year_documents_tenant_isolation ON tax_year_documents
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "benefit_election_change_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benefit_election_change_requests" FORCE ROW LEVEL SECURITY;

CREATE POLICY benefit_election_change_requests_tenant_isolation ON benefit_election_change_requests
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "attendance_correction_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_correction_requests" FORCE ROW LEVEL SECURITY;

CREATE POLICY attendance_correction_requests_tenant_isolation ON attendance_correction_requests
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "employee_separation_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_separation_tasks" FORCE ROW LEVEL SECURITY;

CREATE POLICY employee_separation_tasks_tenant_isolation ON employee_separation_tasks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = employee_separation_tasks.employee_id
      AND e.tenant_id = current_setting('app.tenant_id', true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = employee_separation_tasks.employee_id
      AND e.tenant_id = current_setting('app.tenant_id', true)
  )
);
