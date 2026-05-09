# Demo integration runbook (`demo` vendor)

Local prerequisites:

1. Postgres and Redis (`docker compose up -d`).
2. Copy [.env.example](.env.example) to `.env` and align `DATABASE_URL`, `REDIS_URL`, `INTEGRATION_SECRET_KEY`, `DEMO_WEBHOOK_SECRET`.
3. Apply schema: `npx prisma migrate deploy` (or `npm run db:migrate` during development).
4. Run Next (`npm run dev`) **and** the worker in a second terminal: `npm run worker:integrations`.

## Flow A — outbound JSON API (circuit breaker + retries)

1. Bootstrap M2M token bundle (creates stub `organizations` row + encrypted token):

```bash
curl -s -X POST http://localhost:3000/api/integrations/demo/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"tenantId":"tenant-demo-1"}'
```

2. Enqueue a sync (transactional **outbox** → BullMQ → worker):

```bash
curl -s -X POST http://localhost:3000/api/integrations/demo/sync \
  -H 'Content-Type: application/json' \
  -d '{"tenantId":"tenant-demo-1","remoteUserId":1}'
```

3. Worker pulls `remoteUserId` from the public demo API (`jsonplaceholder.typicode.com`), maps to `employees` + `employee_vendor_links`, with per-vendor **circuit breaker** and HTTP error taxonomy.

## Flow B — inbound webhook (HMAC + dedupe + fast ACK)

Send a POST with headers `X-Tenant-Id`, `X-Event-Id`, `X-Demo-Signature`:

- Body: `{ "event": "person.updated", "person": { "id": "ext_1", "email": "leah@grove.test", "first_name": "Leah", "last_name": "Ng" } }`
- `X-Demo-Signature`: `sha256=` + hex HMAC-SHA256 of the **raw** body using `DEMO_WEBHOOK_SECRET`.

Example (Node):

```javascript
const crypto = require('crypto');
const body = '{"event":"person.updated","person":{"id":"ext_1","email":"a@b.com","first_name":"A","last_name":"B"}}';
const sig = 'sha256=' + crypto.createHmac('sha256', process.env.DEMO_WEBHOOK_SECRET).update(body).digest('hex');
```

Duplicate `X-Event-Id` returns `200 { ok:true, duplicate:true }` (idempotent ACK).

## Dead letters and replay

On terminal BullMQ failure (exhausted retries or `UnrecoverableError`), a row is inserted into `integration_dead_letters`.

Replay:

```bash
npx tsx scripts/dlq-replay.ts <deadLetterId>
```

## Metrics

GET `/api/integrations/metrics` returns in-process counters (HTTP attempts, upserts, etc.). Prefer wiring these to Prometheus in production.

## Operations notes

- **Token refresh**: worker extends demo tokens before expiry and uses `refresh_lock_until` as a naive lock column.
- **Outbox publisher** runs inside the worker process every 2s (replace with Kafka or a dedicated ECS task when scaling).
- **Payload retention**: webhooks enqueue normalized JSON only; tune raw payload archival per legal retention policy.
