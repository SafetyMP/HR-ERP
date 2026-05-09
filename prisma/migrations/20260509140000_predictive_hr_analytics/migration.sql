-- Predictive HR: core people analytics schema (extends organizations / employees).
-- Requires: prior migrations through attendance_punches + RLS baseline.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "EmploymentEventType" AS ENUM ('HIRE', 'PROMOTION', 'TRANSFER', 'TERMINATION_VOLUNTARY', 'TERMINATION_INVOLUNTARY', 'LAYOFF', 'OTHER');

-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('employee', 'manager', 'hr_admin', 'payroll_admin', 'auditor_readonly');

-- CreateEnum
CREATE TYPE "BenchmarkAlertSeverity" AS ENUM ('INFO', 'WARN', 'CRITICAL');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_roles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT,
    "department_id" TEXT,
    "canonical_title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_roles_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "manager_id" TEXT,
ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "job_role_id" TEXT,
ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "hire_date" TIMESTAMP(3),
ADD COLUMN     "termination_date" TIMESTAMP(3),
ADD COLUMN     "anonymized_pseudonym" TEXT;

-- CreateTable
CREATE TABLE "compensation_records" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "base_amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "band_position" DOUBLE PRECISION,
    "internal_band_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compensation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pto_balances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "balance_hours" DECIMAL(10,2) NOT NULL,
    "as_of_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pto_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "overall_rating" DOUBLE PRECISION,
    "sentiment_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_events" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "event_type" "EmploymentEventType" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_skills" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "proficiency" INTEGER NOT NULL,
    "embedding" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_skill_targets" (
    "job_role_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "role_skill_targets_pkey" PRIMARY KEY ("job_role_id","skill_id")
);

-- CreateTable
CREATE TABLE "user_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "employee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "user_id" TEXT NOT NULL,
    "role" "AppRole" NOT NULL,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_feature_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "features" JSONB NOT NULL,
    "churned_within_180d" BOOLEAN,
    "etl_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_feature_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churn_scores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "drivers" JSONB NOT NULL,
    "model_version" TEXT NOT NULL,
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "churn_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_registry" (
    "id" TEXT NOT NULL,
    "model_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "artifact_uri" TEXT NOT NULL,
    "metrics" JSONB,
    "is_production" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_benchmarks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_role_id" TEXT,
    "geo_code" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "provider" TEXT NOT NULL DEFAULT 'mock_provider',
    "p50_annual" DECIMAL(14,2),
    "p75_annual" DECIMAL(14,2),
    "p90_annual" DECIMAL(14,2),
    "sample_size" INTEGER,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_role_id" TEXT,
    "severity" "BenchmarkAlertSeverity" NOT NULL DEFAULT 'WARN',
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cleared_at" TIMESTAMP(3),

    CONSTRAINT "benchmark_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_title_maps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "internal_title_key" TEXT NOT NULL,
    "geo_code" TEXT NOT NULL,
    "normalized_title" TEXT NOT NULL,
    "external_occupation_code" TEXT,
    "job_role_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_title_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_tenant_id_code_key" ON "departments"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "departments_tenant_id_idx" ON "departments"("tenant_id");

-- CreateIndex
CREATE INDEX "job_roles_tenant_id_idx" ON "job_roles"("tenant_id");

-- CreateIndex
CREATE INDEX "job_roles_tenant_id_title_idx" ON "job_roles"("tenant_id", "title");

-- CreateIndex
CREATE INDEX "employees_tenant_id_manager_id_idx" ON "employees"("tenant_id", "manager_id");

-- CreateIndex
CREATE INDEX "employees_tenant_id_job_role_id_idx" ON "employees"("tenant_id", "job_role_id");

-- CreateIndex
CREATE INDEX "compensation_records_employee_id_effective_from_idx" ON "compensation_records"("employee_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "pto_balances_employee_id_as_of_date_key" ON "pto_balances"("employee_id", "as_of_date");

-- CreateIndex
CREATE INDEX "performance_reviews_employee_id_idx" ON "performance_reviews"("employee_id");

-- CreateIndex
CREATE INDEX "employment_events_employee_id_occurred_at_idx" ON "employment_events"("employee_id", "occurred_at");

-- CreateIndex
CREATE INDEX "employment_events_event_type_idx" ON "employment_events"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "skills_tenant_id_slug_key" ON "skills"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "skills_tenant_id_idx" ON "skills"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_skills_employee_id_skill_id_key" ON "employee_skills"("employee_id", "skill_id");

-- CreateIndex
CREATE INDEX "employee_skills_skill_id_idx" ON "employee_skills"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_tenant_id_email_key" ON "user_accounts"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "user_accounts_tenant_id_idx" ON "user_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "analytics_feature_snapshots_tenant_id_snapshot_date_idx" ON "analytics_feature_snapshots"("tenant_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "analytics_feature_snapshots_employee_id_idx" ON "analytics_feature_snapshots"("employee_id");

-- CreateIndex
CREATE INDEX "churn_scores_tenant_id_scored_at_idx" ON "churn_scores"("tenant_id", "scored_at");

-- CreateIndex
CREATE INDEX "churn_scores_employee_id_idx" ON "churn_scores"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "model_registry_model_type_version_key" ON "model_registry"("model_type", "version");

-- CreateIndex
CREATE INDEX "model_registry_model_type_is_production_idx" ON "model_registry"("model_type", "is_production");

-- CreateIndex
CREATE INDEX "market_benchmarks_tenant_id_effective_date_idx" ON "market_benchmarks"("tenant_id", "effective_date");

-- CreateIndex
CREATE INDEX "market_benchmarks_job_role_id_idx" ON "market_benchmarks"("job_role_id");

-- CreateIndex
CREATE INDEX "benchmark_alerts_tenant_id_created_at_idx" ON "benchmark_alerts"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_title_maps_tenant_id_internal_title_key_geo_code_key" ON "job_title_maps"("tenant_id", "internal_title_key", "geo_code");

-- CreateIndex
CREATE INDEX "job_title_maps_tenant_id_idx" ON "job_title_maps"("tenant_id");

-- AddForeignKey
ALTER TABLE "job_roles" ADD CONSTRAINT "job_roles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensation_records" ADD CONSTRAINT "compensation_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pto_balances" ADD CONSTRAINT "pto_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_events" ADD CONSTRAINT "employment_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_skill_targets" ADD CONSTRAINT "role_skill_targets_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_skill_targets" ADD CONSTRAINT "role_skill_targets_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_feature_snapshots" ADD CONSTRAINT "analytics_feature_snapshots_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "churn_scores" ADD CONSTRAINT "churn_scores_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_benchmarks" ADD CONSTRAINT "market_benchmarks_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_alerts" ADD CONSTRAINT "benchmark_alerts_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_title_maps" ADD CONSTRAINT "job_title_maps_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Row Level Security (align with `enable_rls` migration)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments FORCE ROW LEVEL SECURITY;
CREATE POLICY departments_tenant_isolation ON departments
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_roles FORCE ROW LEVEL SECURITY;
CREATE POLICY job_roles_tenant_isolation ON job_roles
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE compensation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_records FORCE ROW LEVEL SECURITY;
CREATE POLICY compensation_records_tenant_isolation ON compensation_records
FOR ALL
USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = compensation_records.employee_id AND e.tenant_id = current_setting('app.tenant_id', true))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = compensation_records.employee_id AND e.tenant_id = current_setting('app.tenant_id', true))
);

ALTER TABLE pto_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE pto_balances FORCE ROW LEVEL SECURITY;
CREATE POLICY pto_balances_tenant_isolation ON pto_balances
FOR ALL
USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = pto_balances.employee_id AND e.tenant_id = current_setting('app.tenant_id', true))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = pto_balances.employee_id AND e.tenant_id = current_setting('app.tenant_id', true))
);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY performance_reviews_tenant_isolation ON performance_reviews
FOR ALL
USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = performance_reviews.employee_id AND e.tenant_id = current_setting('app.tenant_id', true))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = performance_reviews.employee_id AND e.tenant_id = current_setting('app.tenant_id', true))
);

ALTER TABLE employment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_events FORCE ROW LEVEL SECURITY;
CREATE POLICY employment_events_tenant_isolation ON employment_events
FOR ALL
USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = employment_events.employee_id AND e.tenant_id = current_setting('app.tenant_id', true))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = employment_events.employee_id AND e.tenant_id = current_setting('app.tenant_id', true))
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills FORCE ROW LEVEL SECURITY;
CREATE POLICY skills_tenant_isolation ON skills
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills FORCE ROW LEVEL SECURITY;
CREATE POLICY employee_skills_tenant_isolation ON employee_skills
FOR ALL
USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_skills.employee_id AND e.tenant_id = current_setting('app.tenant_id', true))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_skills.employee_id AND e.tenant_id = current_setting('app.tenant_id', true))
);

ALTER TABLE role_skill_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_skill_targets FORCE ROW LEVEL SECURITY;
CREATE POLICY role_skill_targets_tenant_isolation ON role_skill_targets
FOR ALL
USING (
  EXISTS (SELECT 1 FROM job_roles jr WHERE jr.id = role_skill_targets.job_role_id AND jr.tenant_id = current_setting('app.tenant_id', true))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM job_roles jr WHERE jr.id = role_skill_targets.job_role_id AND jr.tenant_id = current_setting('app.tenant_id', true))
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts FORCE ROW LEVEL SECURITY;
CREATE POLICY user_accounts_tenant_isolation ON user_accounts
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY user_role_assignments_tenant_isolation ON user_role_assignments
FOR ALL
USING (
  EXISTS (SELECT 1 FROM user_accounts u WHERE u.id = user_role_assignments.user_id AND u.tenant_id = current_setting('app.tenant_id', true))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_accounts u WHERE u.id = user_role_assignments.user_id AND u.tenant_id = current_setting('app.tenant_id', true))
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE analytics_feature_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_feature_snapshots FORCE ROW LEVEL SECURITY;
CREATE POLICY analytics_feature_snapshots_tenant_isolation ON analytics_feature_snapshots
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE churn_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_scores FORCE ROW LEVEL SECURITY;
CREATE POLICY churn_scores_tenant_isolation ON churn_scores
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE market_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_benchmarks FORCE ROW LEVEL SECURITY;
CREATE POLICY market_benchmarks_tenant_isolation ON market_benchmarks
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE benchmark_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_alerts FORCE ROW LEVEL SECURITY;
CREATE POLICY benchmark_alerts_tenant_isolation ON benchmark_alerts
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE job_title_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_title_maps FORCE ROW LEVEL SECURITY;
CREATE POLICY job_title_maps_tenant_isolation ON job_title_maps
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
