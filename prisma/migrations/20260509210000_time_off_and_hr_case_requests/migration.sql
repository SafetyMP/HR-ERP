-- Feature 006 / 010 — employee time-off submissions + HR intake tickets

CREATE TYPE "TimeOffRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

CREATE TYPE "HrCaseCategory" AS ENUM ('PAYROLL', 'BENEFITS', 'HR_OTHER');

CREATE TYPE "HrCaseStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED');

CREATE TABLE "time_off_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "TimeOffRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "time_off_requests_tenant_id_employee_id_idx" ON "time_off_requests"("tenant_id", "employee_id");

ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "hr_case_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "category" "HrCaseCategory" NOT NULL,
    "body" TEXT NOT NULL,
    "status" "HrCaseStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_case_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hr_case_requests_tenant_id_employee_id_idx" ON "hr_case_requests"("tenant_id", "employee_id");

ALTER TABLE "hr_case_requests" ADD CONSTRAINT "hr_case_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "time_off_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "time_off_requests" FORCE ROW LEVEL SECURITY;

CREATE POLICY time_off_requests_tenant_isolation ON time_off_requests
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "hr_case_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr_case_requests" FORCE ROW LEVEL SECURITY;

CREATE POLICY hr_case_requests_tenant_isolation ON hr_case_requests
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
