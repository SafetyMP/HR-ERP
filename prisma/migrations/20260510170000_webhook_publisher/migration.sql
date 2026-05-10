-- Webhook publisher subscriptions + delivery log. Tenant-isolated via RLS.

CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'RETRY', 'FAILED');

CREATE TABLE "webhook_subscriptions" (
  "id"          TEXT NOT NULL,
  "tenant_id"   TEXT NOT NULL,
  "label"       TEXT NOT NULL,
  "target_url"  TEXT NOT NULL,
  "secret"      TEXT NOT NULL,
  "event_types" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "is_active"   BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "webhook_subscriptions_tenant_id_is_active_idx"
  ON "webhook_subscriptions" ("tenant_id", "is_active");

CREATE TABLE "webhook_deliveries" (
  "id"                 TEXT NOT NULL,
  "tenant_id"          TEXT NOT NULL,
  "subscription_id"    TEXT NOT NULL,
  "event_type"         TEXT NOT NULL,
  "status"             "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attempt"            INTEGER NOT NULL DEFAULT 0,
  "last_response_code" INTEGER,
  "last_error"         TEXT,
  "signature"          TEXT NOT NULL,
  "payload"            JSONB NOT NULL,
  "scheduled_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "delivered_at"       TIMESTAMP(3),
  "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "webhook_deliveries_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "webhook_subscriptions" ("id") ON DELETE CASCADE
);
CREATE INDEX "webhook_deliveries_tenant_id_status_idx"
  ON "webhook_deliveries" ("tenant_id", "status");
CREATE INDEX "webhook_deliveries_subscription_id_scheduled_at_idx"
  ON "webhook_deliveries" ("subscription_id", "scheduled_at");

ALTER TABLE "webhook_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_subscriptions" FORCE ROW LEVEL SECURITY;
CREATE POLICY webhook_subscriptions_tenant_isolation ON "webhook_subscriptions"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE "webhook_deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_deliveries" FORCE ROW LEVEL SECURITY;
CREATE POLICY webhook_deliveries_tenant_isolation ON "webhook_deliveries"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
