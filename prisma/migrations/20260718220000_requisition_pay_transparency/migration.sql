-- Brief 029: optional pay-transparency fields on job requisitions (teaching surface).
ALTER TABLE "job_requisitions" ADD COLUMN IF NOT EXISTS "pay_range_min" DECIMAL(14, 2);
ALTER TABLE "job_requisitions" ADD COLUMN IF NOT EXISTS "pay_range_max" DECIMAL(14, 2);
ALTER TABLE "job_requisitions" ADD COLUMN IF NOT EXISTS "pay_range_currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "job_requisitions" ADD COLUMN IF NOT EXISTS "posting_jurisdiction" TEXT;
