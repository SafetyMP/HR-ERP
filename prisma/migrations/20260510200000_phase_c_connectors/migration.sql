-- Phase C connectors: payroll partner export + benefits carrier delivery status

CREATE TYPE "PayrollPartnerExportStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE "CarrierDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED');

CREATE TABLE "payroll_partner_exports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "payroll_period_id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "export_id" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "status" "PayrollPartnerExportStatus" NOT NULL DEFAULT 'PENDING',
    "last_error" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_partner_exports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payroll_partner_exports_tenant_id_payroll_period_id_integratio_key" ON "payroll_partner_exports"("tenant_id", "payroll_period_id", "integration_id");
CREATE INDEX "payroll_partner_exports_tenant_id_payroll_period_id_idx" ON "payroll_partner_exports"("tenant_id", "payroll_period_id");

ALTER TABLE "payroll_partner_exports" ADD CONSTRAINT "payroll_partner_exports_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "benefit_life_events" ADD COLUMN "carrier_delivery_status" "CarrierDeliveryStatus",
ADD COLUMN "carrier_delivery_at" TIMESTAMP(3),
ADD COLUMN "carrier_delivery_error" VARCHAR(500);
