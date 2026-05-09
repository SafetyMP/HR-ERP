-- PTO chaos / QA table: enforces one request per employee calendar day per tenant.
CREATE TABLE "pto_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "request_date" DATE NOT NULL,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pto_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pto_requests_tenant_id_employee_id_request_date_key" ON "pto_requests"("tenant_id", "employee_id", "request_date");

CREATE INDEX "pto_requests_tenant_id_employee_id_idx" ON "pto_requests"("tenant_id", "employee_id");

ALTER TABLE "pto_requests" ADD CONSTRAINT "pto_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
