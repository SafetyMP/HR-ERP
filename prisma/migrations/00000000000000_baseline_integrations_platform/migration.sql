-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "PunchKind" AS ENUM ('CLOCK_IN', 'CLOCK_OUT');

-- CreateEnum
CREATE TYPE "IntegrationHealth" AS ENUM ('ACTIVE', 'DEGRADED', 'DISABLED');

-- CreateEnum
CREATE TYPE "CalendarSystem" AS ENUM ('GREGORIAN', 'ISLAMIC_UMALQURA', 'HEBREW', 'PERSIAN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NameOrderPreference" AS ENUM ('GIVEN_FAMILY', 'FAMILY_GIVEN', 'LEGAL_DOCUMENT_ORDER');

-- CreateEnum
CREATE TYPE "MeetingProposalStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutLineType" AS ENUM ('SALARY', 'BONUS', 'EXPENSE_REIMBURSEMENT', 'CONTRACTOR_PAY');

-- CreateEnum
CREATE TYPE "PayoutSplitMode" AS ENUM ('PERCENT_BASIS_POINTS', 'FIXED_MINOR_UNITS');

-- CreateEnum
CREATE TYPE "HolidayRuleType" AS ENUM ('FIXED_GREGORIAN', 'RULE_EASTER_OFFSET', 'IMPORTED_ANNUAL', 'LUNAR');

-- CreateEnum
CREATE TYPE "CapacityAdjustmentReason" AS ENUM ('STATUTORY_HOLIDAY', 'PTO', 'CUSTOM');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jurisdiction_country" TEXT,
    "jurisdiction_subdivision" TEXT,
    "reporting_currency" TEXT,
    "payout_split_mode" "PayoutSplitMode" NOT NULL DEFAULT 'PERCENT_BASIS_POINTS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_work_contexts" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "primary_timezone" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "preferred_first_day_of_week" INTEGER,
    "calendar_system" "CalendarSystem" NOT NULL DEFAULT 'GREGORIAN',
    "calendar_custom_note" TEXT,
    "honorific" TEXT,
    "given_name" TEXT,
    "family_name" TEXT,
    "additional_name" TEXT,
    "display_name" TEXT,
    "name_order_preference" "NameOrderPreference" NOT NULL DEFAULT 'GIVEN_FAMILY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_work_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_intervals" (
    "id" TEXT NOT NULL,
    "work_context_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,

    CONSTRAINT "work_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduling_preferences" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "async_first_default" BOOLEAN NOT NULL DEFAULT true,
    "overlap_window_minutes" INTEGER NOT NULL DEFAULT 30,
    "quiet_hours_start_minute" INTEGER,
    "quiet_hours_end_minute" INTEGER,

    CONSTRAINT "scheduling_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_proposals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organizer_employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "MeetingProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_proposal_slots" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "start_utc" TIMESTAMP(3) NOT NULL,
    "end_utc" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_proposal_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_proposal_participants" (
    "proposal_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,

    CONSTRAINT "meeting_proposal_participants_pkey" PRIMARY KEY ("proposal_id","employee_id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_instructions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "payroll_period_id" TEXT,
    "reporting_fx_snapshot_id" TEXT,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_lines" (
    "id" TEXT NOT NULL,
    "payment_instruction_id" TEXT NOT NULL,
    "line_type" "PayoutLineType" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "amount_minor" INTEGER,
    "allocation_basis_points" INTEGER,
    "currency_code" TEXT,
    "crypto_asset_id" TEXT,

    CONSTRAINT "payout_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_snapshots" (
    "id" TEXT NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" DECIMAL(20,10) NOT NULL,
    "quoted_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "fx_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_calendars" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "jurisdiction_country" TEXT NOT NULL,
    "jurisdiction_subdivision" TEXT,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "provider" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holiday_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_observations" (
    "id" TEXT NOT NULL,
    "holiday_calendar_id" TEXT NOT NULL,
    "local_name_key" TEXT NOT NULL,
    "rule_type" "HolidayRuleType" NOT NULL,
    "fixed_month" INTEGER,
    "fixed_day" INTEGER,
    "easter_offset_days" INTEGER,
    "external_id" TEXT,
    "effective_from" DATE,
    "effective_to" DATE,
    "source" TEXT,

    CONSTRAINT "holiday_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_observation_dates" (
    "id" TEXT NOT NULL,
    "observation_id" TEXT NOT NULL,
    "local_date" DATE NOT NULL,

    CONSTRAINT "holiday_observation_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_holiday_regions" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "holiday_calendar_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,

    CONSTRAINT "employee_holiday_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "team_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_utc" TIMESTAMP(3) NOT NULL,
    "end_utc" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacity_adjustments" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "sprint_id" TEXT,
    "local_date" DATE NOT NULL,
    "reason" "CapacityAdjustmentReason" NOT NULL,
    "minutes_reduced" INTEGER NOT NULL,
    "holiday_observation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capacity_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_capacity_summaries" (
    "id" TEXT NOT NULL,
    "sprint_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "total_minutes_baseline" INTEGER NOT NULL,
    "total_minutes_reduced" INTEGER NOT NULL,

    CONSTRAINT "sprint_capacity_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_tasks" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_punches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "kind" "PunchKind" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'api_v1',
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_punches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_instances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_key" TEXT NOT NULL,
    "health" "IntegrationHealth" NOT NULL DEFAULT 'ACTIVE',
    "encrypted_token_bundle" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "oauth_scope" TEXT,
    "config_json" JSONB,
    "refresh_lock_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_outbox" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "job_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "integration_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_dead_letters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "vendor_key" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "failure_reason" TEXT NOT NULL,
    "correlation_id" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "replayed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_dead_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event_dedupe" (
    "id" TEXT NOT NULL,
    "vendor_key" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "external_event_id" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_event_dedupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_vendor_links" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "vendor_key" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_vendor_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employees_tenant_id_idx" ON "employees"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_tenant_id_email_key" ON "employees"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "employee_work_contexts_employee_id_key" ON "employee_work_contexts"("employee_id");

-- CreateIndex
CREATE INDEX "work_intervals_work_context_id_idx" ON "work_intervals"("work_context_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheduling_preferences_employee_id_key" ON "scheduling_preferences"("employee_id");

-- CreateIndex
CREATE INDEX "meeting_proposals_tenant_id_idx" ON "meeting_proposals"("tenant_id");

-- CreateIndex
CREATE INDEX "meeting_proposal_slots_proposal_id_idx" ON "meeting_proposal_slots"("proposal_id");

-- CreateIndex
CREATE INDEX "payroll_periods_tenant_id_idx" ON "payroll_periods"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_instructions_tenant_id_idx" ON "payment_instructions"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_instructions_employee_id_idx" ON "payment_instructions"("employee_id");

-- CreateIndex
CREATE INDEX "payout_lines_payment_instruction_id_idx" ON "payout_lines"("payment_instruction_id");

-- CreateIndex
CREATE INDEX "fx_snapshots_from_currency_to_currency_quoted_at_idx" ON "fx_snapshots"("from_currency", "to_currency", "quoted_at");

-- CreateIndex
CREATE INDEX "holiday_calendars_tenant_id_idx" ON "holiday_calendars"("tenant_id");

-- CreateIndex
CREATE INDEX "holiday_observations_holiday_calendar_id_idx" ON "holiday_observations"("holiday_calendar_id");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_observations_holiday_calendar_id_external_id_key" ON "holiday_observations"("holiday_calendar_id", "external_id");

-- CreateIndex
CREATE INDEX "holiday_observation_dates_local_date_idx" ON "holiday_observation_dates"("local_date");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_observation_dates_observation_id_local_date_key" ON "holiday_observation_dates"("observation_id", "local_date");

-- CreateIndex
CREATE INDEX "employee_holiday_regions_employee_id_idx" ON "employee_holiday_regions"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_holiday_regions_employee_id_holiday_calendar_id_key" ON "employee_holiday_regions"("employee_id", "holiday_calendar_id");

-- CreateIndex
CREATE INDEX "sprints_tenant_id_team_key_idx" ON "sprints"("tenant_id", "team_key");

-- CreateIndex
CREATE INDEX "capacity_adjustments_employee_id_local_date_idx" ON "capacity_adjustments"("employee_id", "local_date");

-- CreateIndex
CREATE INDEX "capacity_adjustments_sprint_id_idx" ON "capacity_adjustments"("sprint_id");

-- CreateIndex
CREATE UNIQUE INDEX "sprint_capacity_summaries_sprint_id_employee_id_key" ON "sprint_capacity_summaries"("sprint_id", "employee_id");

-- CreateIndex
CREATE INDEX "onboarding_tasks_employee_id_idx" ON "onboarding_tasks"("employee_id");

-- CreateIndex
CREATE INDEX "attendance_punches_tenant_id_employee_id_occurred_at_idx" ON "attendance_punches"("tenant_id", "employee_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_punches_tenant_id_idempotency_key_key" ON "attendance_punches"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "integration_instances_tenant_id_idx" ON "integration_instances"("tenant_id");

-- CreateIndex
CREATE INDEX "integration_instances_token_expires_at_idx" ON "integration_instances"("token_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "integration_instances_tenant_id_vendor_key_key" ON "integration_instances"("tenant_id", "vendor_key");

-- CreateIndex
CREATE INDEX "integration_outbox_published_at_created_at_idx" ON "integration_outbox"("published_at", "created_at");

-- CreateIndex
CREATE INDEX "integration_dead_letters_vendor_key_created_at_idx" ON "integration_dead_letters"("vendor_key", "created_at");

-- CreateIndex
CREATE INDEX "webhook_event_dedupe_received_at_idx" ON "webhook_event_dedupe"("received_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_dedupe_vendor_key_tenant_id_external_event_id_key" ON "webhook_event_dedupe"("vendor_key", "tenant_id", "external_event_id");

-- CreateIndex
CREATE INDEX "employee_vendor_links_employee_id_idx" ON "employee_vendor_links"("employee_id");

-- CreateIndex
CREATE INDEX "employee_vendor_links_tenant_id_idx" ON "employee_vendor_links"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_vendor_links_employee_id_vendor_key_key" ON "employee_vendor_links"("employee_id", "vendor_key");

-- CreateIndex
CREATE UNIQUE INDEX "employee_vendor_links_tenant_id_vendor_key_external_id_key" ON "employee_vendor_links"("tenant_id", "vendor_key", "external_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_work_contexts" ADD CONSTRAINT "employee_work_contexts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_intervals" ADD CONSTRAINT "work_intervals_work_context_id_fkey" FOREIGN KEY ("work_context_id") REFERENCES "employee_work_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling_preferences" ADD CONSTRAINT "scheduling_preferences_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_proposals" ADD CONSTRAINT "meeting_proposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_proposals" ADD CONSTRAINT "meeting_proposals_organizer_employee_id_fkey" FOREIGN KEY ("organizer_employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_proposal_slots" ADD CONSTRAINT "meeting_proposal_slots_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "meeting_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_proposal_participants" ADD CONSTRAINT "meeting_proposal_participants_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "meeting_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_proposal_participants" ADD CONSTRAINT "meeting_proposal_participants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_instructions" ADD CONSTRAINT "payment_instructions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_instructions" ADD CONSTRAINT "payment_instructions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_instructions" ADD CONSTRAINT "payment_instructions_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_instructions" ADD CONSTRAINT "payment_instructions_reporting_fx_snapshot_id_fkey" FOREIGN KEY ("reporting_fx_snapshot_id") REFERENCES "fx_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_payment_instruction_id_fkey" FOREIGN KEY ("payment_instruction_id") REFERENCES "payment_instructions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_calendars" ADD CONSTRAINT "holiday_calendars_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_observations" ADD CONSTRAINT "holiday_observations_holiday_calendar_id_fkey" FOREIGN KEY ("holiday_calendar_id") REFERENCES "holiday_calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_observation_dates" ADD CONSTRAINT "holiday_observation_dates_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "holiday_observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_holiday_regions" ADD CONSTRAINT "employee_holiday_regions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_holiday_regions" ADD CONSTRAINT "employee_holiday_regions_holiday_calendar_id_fkey" FOREIGN KEY ("holiday_calendar_id") REFERENCES "holiday_calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_adjustments" ADD CONSTRAINT "capacity_adjustments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_adjustments" ADD CONSTRAINT "capacity_adjustments_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_adjustments" ADD CONSTRAINT "capacity_adjustments_holiday_observation_id_fkey" FOREIGN KEY ("holiday_observation_id") REFERENCES "holiday_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_capacity_summaries" ADD CONSTRAINT "sprint_capacity_summaries_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_capacity_summaries" ADD CONSTRAINT "sprint_capacity_summaries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_vendor_links" ADD CONSTRAINT "employee_vendor_links_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
