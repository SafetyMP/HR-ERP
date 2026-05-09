-- Feature 003: employee benefit enrollment rows (self-service summary).

CREATE TYPE "BenefitCategory" AS ENUM ('MEDICAL', 'DENTAL', 'VISION', 'INCOME_PROTECTION', 'RETIREMENT');

CREATE TABLE "benefit_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "category" "BenefitCategory" NOT NULL,
    "plan_label" TEXT NOT NULL,
    "carrier_name" TEXT,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "dependent_count" INTEGER,
    "retirement_deferral_basis_points" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefit_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "benefit_enrollments_tenant_id_employee_id_idx" ON "benefit_enrollments"("tenant_id", "employee_id");

ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "benefit_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benefit_enrollments" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS benefit_enrollments_tenant_isolation ON "benefit_enrollments";

CREATE POLICY benefit_enrollments_tenant_isolation ON "benefit_enrollments"
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
