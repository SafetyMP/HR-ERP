/**
 * Kafka publisher for domain_outbox.
 *
 * OUTBOX_DATABASE_URL must use a dedicated role that can see all tenants
 * (BYPASSRLS or equivalent). The app DSN (NOBYPASSRLS) cannot drain this table
 * under FORCE ROW LEVEL SECURITY without per-tenant GUCs.
 */
import pg from "pg";
import { Kafka, Partitioners, logLevel } from "kafkajs";

const OUTBOX_DATABASE_URL = process.env.OUTBOX_DATABASE_URL;
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS ?? "localhost:9092")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const POLL_MS = Number(process.env.OUTBOX_POLL_MS ?? "1000");
const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE ?? "50");
/** Stale claims older than this are reclaimed (crash after claim, before finalize). */
const CLAIM_STALE_MS = Number(process.env.OUTBOX_CLAIM_STALE_MS ?? String(5 * 60_000));

if (!OUTBOX_DATABASE_URL) {
  console.error("OUTBOX_DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: OUTBOX_DATABASE_URL, max: 8 });

const kafka = new Kafka({
  clientId: "hr-erp-outbox-publisher",
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.NOTHING,
});

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
  allowAutoTopicCreation: true,
});

type OutboxRow = {
  id: string;
  tenant_id: string;
  topic: string;
  partition_key: string;
  payload: unknown;
  headers: Record<string, unknown> | null;
};

async function reclaimStaleClaims(client: pg.PoolClient): Promise<void> {
  await client.query(
    `
    UPDATE domain_outbox
    SET claimed_at = NULL
    WHERE published_at IS NULL
      AND claimed_at IS NOT NULL
      AND claimed_at < now() - ($1::double precision * interval '1 millisecond')
    `,
    [CLAIM_STALE_MS],
  );
}

async function claimBatch(client: pg.PoolClient): Promise<OutboxRow[]> {
  await reclaimStaleClaims(client);
  const { rows } = await client.query<OutboxRow>(
    `
    WITH picked AS (
      SELECT id
      FROM domain_outbox
      WHERE published_at IS NULL
        AND claimed_at IS NULL
      ORDER BY created_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE domain_outbox d
    SET claimed_at = now()
    FROM picked
    WHERE d.id = picked.id
    RETURNING d.id, d.tenant_id, d.topic, d.partition_key, d.payload, d.headers
    `,
    [BATCH_SIZE],
  );
  return rows;
}

async function finalizePublished(client: pg.PoolClient, ids: string[]) {
  if (ids.length === 0) return;
  await client.query(
    `
    UPDATE domain_outbox
    SET published_at = now(), claimed_at = NULL
    WHERE id = ANY($1::uuid[])
    `,
    [ids],
  );
}

async function releaseClaim(client: pg.PoolClient, ids: string[]) {
  if (ids.length === 0) return;
  await client.query(
    `
    UPDATE domain_outbox
    SET claimed_at = NULL
    WHERE id = ANY($1::uuid[])
      AND published_at IS NULL
    `,
    [ids],
  );
}

function kafkaHeaders(
  row: OutboxRow,
): Record<string, Buffer> | undefined {
  const base: Record<string, Buffer> = {
    tenant_id: Buffer.from(row.tenant_id, "utf8"),
    event_schema: Buffer.from("json-envelope-v1", "utf8"),
  };
  const extra = row.headers ?? {};
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined || v === null) continue;
    base[k] = Buffer.from(
      typeof v === "string" ? v : JSON.stringify(v),
      "utf8",
    );
  }
  return base;
}

async function loop() {
  await producer.connect();
  let failureBackoffMs = POLL_MS;

  for (;;) {
    const client = await pool.connect();
    let rows: OutboxRow[] = [];
    try {
      await client.query("BEGIN");
      rows = await claimBatch(client);
      await client.query("COMMIT");
      failureBackoffMs = POLL_MS;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("[outbox] claim failed", err);
      failureBackoffMs = Math.min(failureBackoffMs * 2, 60_000);
      await new Promise((r) => setTimeout(r, failureBackoffMs));
      continue;
    } finally {
      client.release();
    }

    if (rows.length === 0) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      continue;
    }

    const ids = rows.map((r) => r.id);

    try {
      for (const row of rows) {
        await producer.send({
          topic: row.topic,
          messages: [
            {
              key: row.partition_key,
              value: JSON.stringify({
                outbox_id: row.id,
                tenant_id: row.tenant_id,
                payload: row.payload,
              }),
              headers: kafkaHeaders(row),
            },
          ],
        });
      }

      const done = await pool.connect();
      try {
        await finalizePublished(done, ids);
      } finally {
        done.release();
      }
      failureBackoffMs = POLL_MS;
    } catch (err) {
      console.error("[outbox] publish failed", err);
      const revert = await pool.connect();
      try {
        await releaseClaim(revert, ids);
      } finally {
        revert.release();
      }
      failureBackoffMs = Math.min(failureBackoffMs * 2, 60_000);
      await new Promise((r) => setTimeout(r, failureBackoffMs));
    }
  }
}

void loop().catch(async (e) => {
  console.error(e);
  await producer.disconnect().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
