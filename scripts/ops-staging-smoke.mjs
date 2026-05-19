#!/usr/bin/env node
/**
 * Non-interactive staging / ops smoke checks.
 * Exit 0 when env, Redis, DB, and webhook secret posture are healthy.
 *
 *   node scripts/ops-staging-smoke.mjs
 *   npm run ops:smoke
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const failures = [];
const warnings = [];

function fail(msg) {
  failures.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

const required = ["DATABASE_URL", "JWT_SECRET", "REDIS_URL"];
const missing = required.filter((k) => !(process.env[k] ?? "").trim());
if (missing.length > 0) {
  fail(`missing env: ${missing.join(", ")}`);
}

const webhookKey =
  (process.env.WEBHOOK_ENCRYPTION_KEY ?? process.env.INTEGRATION_SECRET_KEY ?? "").trim();
if (!webhookKey) {
  fail("set WEBHOOK_ENCRYPTION_KEY or INTEGRATION_SECRET_KEY for webhook secrets");
} else if (!process.env.WEBHOOK_ENCRYPTION_KEY?.trim()) {
  warn(
    "WEBHOOK_ENCRYPTION_KEY unset — using INTEGRATION_SECRET_KEY fallback (set a dedicated key in production)",
  );
}

async function pingRedis() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return;
  const { default: Redis } = await import("ioredis");
  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 10_000,
    lazyConnect: true,
  });
  try {
    await client.connect();
    const pong = await client.ping();
    if (pong !== "PONG") {
      fail(`redis ping unexpected response: ${pong}`);
    } else {
      console.log("ops-staging-smoke: redis ok (PONG)");
    }
  } catch (err) {
    fail(`redis unreachable: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    client.disconnect();
  }
}

async function checkDatabaseAndWebhooks() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return;

  const pool = new pg.Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 15_000,
  });

  try {
    await pool.query("SELECT 1");
    console.log("ops-staging-smoke: database ok");

    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM webhook_subscriptions) AS total,
        (SELECT COUNT(*)::int FROM webhook_subscriptions WHERE secret NOT LIKE 'enc:v1:%') AS plaintext
    `);
    const total = rows[0]?.total ?? 0;
    const plaintext = rows[0]?.plaintext ?? 0;
    if (plaintext > 0) {
      fail(
        `${plaintext} webhook subscription(s) still store plaintext secrets — run: npm run webhooks:encrypt-secrets`,
      );
    } else {
      console.log(
        `ops-staging-smoke: webhook secrets ok (${total} subscription(s), all encrypted or none)`,
      );
    }
  } catch (err) {
    fail(`database check failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await pool.end();
  }
}

async function main() {
  if (failures.length === 0) {
    await pingRedis();
    await checkDatabaseAndWebhooks();
  }

  for (const w of warnings) {
    console.warn(`ops-staging-smoke: warn — ${w}`);
  }

  if (failures.length > 0) {
    for (const f of failures) {
      console.error(`ops-staging-smoke: fail — ${f}`);
    }
    console.error(
      "ops-staging-smoke: start workers with npm run worker:webhooks && npm run worker:integrations",
    );
    process.exit(1);
  }

  console.log("ops-staging-smoke: ok — DATABASE_URL, JWT_SECRET, REDIS_URL present");
  console.log(
    `ops-staging-smoke: WEBHOOK_FANOUT_ON_ENQUEUE=${process.env.WEBHOOK_FANOUT_ON_ENQUEUE ?? "(default on)"}`,
  );
  console.log(
    "ops-staging-smoke: start workers with npm run worker:webhooks && npm run worker:integrations",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
