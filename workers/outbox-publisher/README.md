# Outbox → Kafka publisher

Polls `domain_outbox` where `published_at IS NULL`, publishes to Kafka, then marks rows published in a **short** follow-up transaction.

Run one process **per database** (Core HR vs Payroll) with the matching `OUTBOX_DATABASE_URL`.

```bash
OUTBOX_DATABASE_URL="postgresql://core_hr:core_hr_dev_password@localhost:5433/core_hr" \
KAFKA_BROKERS=localhost:9092 \
tsx workers/outbox-publisher/index.ts
```

Environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `OUTBOX_DATABASE_URL` | yes | Postgres DSN containing `domain_outbox` |
| `KAFKA_BROKERS` | yes | Comma-separated hosts |
| `OUTBOX_POLL_MS` | no | Default `1000` |
| `OUTBOX_BATCH_SIZE` | no | Default `50` |

This worker is a **scaffold**: add retries, exponential backoff, and structured logging before production.
