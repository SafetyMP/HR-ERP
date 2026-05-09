-- Core HR bounded context — transactional outbox (same DB as domain aggregates).
-- Apply with: psql "$CORE_HR_DATABASE_URL" -f ... or your migration runner.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS domain_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  tenant_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  partition_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  claimed_at TIMESTAMPTZ NULL,
  published_at TIMESTAMPTZ NULL,
  CONSTRAINT domain_outbox_topic_chk CHECK (
    length(topic) > 0
    AND topic LIKE 'hr.%'
  )
);

CREATE INDEX IF NOT EXISTS idx_domain_outbox_unpublished ON domain_outbox (created_at)
WHERE
  published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_domain_outbox_stale_claim ON domain_outbox (claimed_at)
WHERE
  published_at IS NULL
  AND claimed_at IS NOT NULL;

COMMENT ON TABLE domain_outbox IS 'Transactional outbox: insert with domain rows; publisher sets claimed_at then published_at.';
