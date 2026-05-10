-- LMS, generic workflow engine, and COBRA event log scaffolding.
-- All tables tenant-isolated via RLS using app.tenant_id (set by
-- lib/security/with-authorized-transaction).

CREATE TYPE "LearningCourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LearningEnrollmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'WAIVED', 'EXPIRED');
CREATE TYPE "WorkflowDefinitionKind" AS ENUM (
  'TIME_OFF_APPROVAL',
  'COMPENSATION_CHANGE',
  'POSITION_CHANGE',
  'TERMINATION',
  'CUSTOM',
  'COBRA_ELECTION',
  'ONBOARDING',
  'OFFBOARDING'
);
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED');
CREATE TYPE "WorkflowStepStatus"     AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED', 'EXPIRED');
CREATE TYPE "CobraQualifyingEvent" AS ENUM (
  'TERMINATION',
  'REDUCTION_OF_HOURS',
  'DIVORCE_OR_LEGAL_SEPARATION',
  'DEATH_OF_EMPLOYEE',
  'DEPENDENT_AGE_OUT',
  'MEDICARE_ENTITLEMENT',
  'OTHER'
);
CREATE TYPE "CobraElectionStatus" AS ENUM (
  'PENDING_NOTICE',
  'NOTICE_SENT',
  'ELECTED',
  'WAIVED',
  'EXPIRED',
  'TERMINATED_FOR_NONPAYMENT'
);

-- LMS
CREATE TABLE "learning_courses" (
  "id"                   TEXT NOT NULL,
  "tenant_id"            TEXT NOT NULL,
  "code"                 TEXT NOT NULL,
  "title"                TEXT NOT NULL,
  "description"          TEXT,
  "status"               "LearningCourseStatus" NOT NULL DEFAULT 'DRAFT',
  "mandatory_due_days"   INTEGER,
  "estimated_duration"   TEXT,
  "external_provider"    TEXT,
  "external_content_ref" TEXT,
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "learning_courses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "learning_courses_tenant_id_code_key"
  ON "learning_courses" ("tenant_id", "code");
CREATE INDEX "learning_courses_tenant_id_status_idx"
  ON "learning_courses" ("tenant_id", "status");

CREATE TABLE "learning_enrollments" (
  "id"           TEXT NOT NULL,
  "tenant_id"    TEXT NOT NULL,
  "course_id"    TEXT NOT NULL,
  "employee_id"  TEXT NOT NULL,
  "status"       "LearningEnrollmentStatus" NOT NULL DEFAULT 'ASSIGNED',
  "assigned_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at"   TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "due_at"       TIMESTAMP(3),
  "score_bp"     INTEGER,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "learning_enrollments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "learning_enrollments_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "learning_courses" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "learning_enrollments_tenant_course_employee_key"
  ON "learning_enrollments" ("tenant_id", "course_id", "employee_id");
CREATE INDEX "learning_enrollments_tenant_employee_status_idx"
  ON "learning_enrollments" ("tenant_id", "employee_id", "status");
CREATE INDEX "learning_enrollments_tenant_due_at_idx"
  ON "learning_enrollments" ("tenant_id", "due_at");

-- Workflow engine
CREATE TABLE "workflow_definitions" (
  "id"          TEXT NOT NULL,
  "tenant_id"   TEXT NOT NULL,
  "kind"        "WorkflowDefinitionKind" NOT NULL,
  "code"        TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "steps"       JSONB NOT NULL DEFAULT '[]'::jsonb,
  "is_active"   BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "workflow_definitions_tenant_id_code_key"
  ON "workflow_definitions" ("tenant_id", "code");
CREATE INDEX "workflow_definitions_tenant_id_kind_is_active_idx"
  ON "workflow_definitions" ("tenant_id", "kind", "is_active");

CREATE TABLE "workflow_instances" (
  "id"                   TEXT NOT NULL,
  "tenant_id"            TEXT NOT NULL,
  "definition_id"        TEXT NOT NULL,
  "status"               "WorkflowInstanceStatus" NOT NULL DEFAULT 'ACTIVE',
  "initiator_subject_id" TEXT NOT NULL,
  "subject_type"         TEXT NOT NULL,
  "subject_ref"          TEXT NOT NULL,
  "current_step_index"   INTEGER NOT NULL DEFAULT 0,
  "context"              JSONB NOT NULL DEFAULT '{}'::jsonb,
  "started_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at"         TIMESTAMP(3),
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_instances_definition_id_fkey"
    FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions" ("id") ON DELETE CASCADE
);
CREATE INDEX "workflow_instances_tenant_id_status_idx"
  ON "workflow_instances" ("tenant_id", "status");
CREATE INDEX "workflow_instances_subject_idx"
  ON "workflow_instances" ("tenant_id", "subject_type", "subject_ref");

CREATE TABLE "workflow_step_instances" (
  "id"                  TEXT NOT NULL,
  "tenant_id"           TEXT NOT NULL,
  "instance_id"         TEXT NOT NULL,
  "step_index"          INTEGER NOT NULL,
  "step_name"           TEXT NOT NULL,
  "status"              "WorkflowStepStatus" NOT NULL DEFAULT 'PENDING',
  "approver_subject_id" TEXT,
  "decision_note"       TEXT,
  "decided_at"          TIMESTAMP(3),
  "sla_due_at"          TIMESTAMP(3),
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workflow_step_instances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_step_instances_instance_id_fkey"
    FOREIGN KEY ("instance_id") REFERENCES "workflow_instances" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "workflow_step_instances_instance_step_key"
  ON "workflow_step_instances" ("instance_id", "step_index");
CREATE INDEX "workflow_step_instances_tenant_id_status_idx"
  ON "workflow_step_instances" ("tenant_id", "status");

-- COBRA
CREATE TABLE "cobra_events" (
  "id"               TEXT NOT NULL,
  "tenant_id"        TEXT NOT NULL,
  "employee_id"      TEXT NOT NULL,
  "qualifying_event" "CobraQualifyingEvent" NOT NULL,
  "qualifying_date"  DATE NOT NULL,
  "election_deadline" DATE NOT NULL,
  "notice_sent_at"   TIMESTAMP(3),
  "election_status"  "CobraElectionStatus" NOT NULL DEFAULT 'PENDING_NOTICE',
  "elected_at"       TIMESTAMP(3),
  "payload"          JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cobra_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cobra_events_tenant_id_employee_id_idx"
  ON "cobra_events" ("tenant_id", "employee_id");
CREATE INDEX "cobra_events_tenant_id_election_status_idx"
  ON "cobra_events" ("tenant_id", "election_status");

-- RLS for the new tables.
ALTER TABLE "learning_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_courses" FORCE ROW LEVEL SECURITY;
CREATE POLICY learning_courses_tenant_isolation ON "learning_courses"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "learning_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_enrollments" FORCE ROW LEVEL SECURITY;
CREATE POLICY learning_enrollments_tenant_isolation ON "learning_enrollments"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "workflow_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_definitions" FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_definitions_tenant_isolation ON "workflow_definitions"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "workflow_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_instances" FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_instances_tenant_isolation ON "workflow_instances"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "workflow_step_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_step_instances" FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_step_instances_tenant_isolation ON "workflow_step_instances"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "cobra_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cobra_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY cobra_events_tenant_isolation ON "cobra_events"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
