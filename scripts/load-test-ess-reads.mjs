#!/usr/bin/env node
/**
 * Phase C2 — ESS read-path load probe for `/api/v1/me/*` top-5 routes.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 BEARER_TOKEN=<jwt> node scripts/load-test-ess-reads.mjs
 *   BASE_URL=... BEARER_TOKEN=... CONCURRENCY=50 DURATION_SEC=30 node scripts/load-test-ess-reads.mjs
 *
 * Targets (see docs/architecture/slo-and-load-gates.md Phase C2):
 *   - p95 < 300ms per route at moderate concurrency
 *   - error rate < 0.1%
 */
const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TOKEN = (process.env.BEARER_TOKEN ?? "").trim();
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 20));
const DURATION_SEC = Math.max(5, Number(process.env.DURATION_SEC ?? 20));

const ROUTES = [
  "/api/v1/me/paystub/current",
  "/api/v1/me/benefits/summary",
  "/api/v1/me/pto/summary",
  "/api/v1/me/attendance/today",
  "/api/v1/me/profile",
];

if (!TOKEN) {
  console.error("Set BEARER_TOKEN (demo employee JWT) to run ESS load probe.");
  process.exit(1);
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function fetchRoute(path) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/json",
      },
    });
    const ms = performance.now() - start;
    return { path, ms, ok: res.ok, status: res.status };
  } catch (err) {
    return { path, ms: performance.now() - start, ok: false, status: 0, error: String(err) };
  }
}

async function worker(deadline, samples, errors) {
  while (Date.now() < deadline) {
    const path = ROUTES[Math.floor(Math.random() * ROUTES.length)];
    const result = await fetchRoute(path);
    samples.push(result.ms);
    if (!result.ok) errors.push(result);
  }
}

async function main() {
  const deadline = Date.now() + DURATION_SEC * 1000;
  const samples = [];
  const errors = [];

  console.log(
    JSON.stringify({
      scope: "load_test_ess_reads",
      baseUrl: BASE_URL,
      concurrency: CONCURRENCY,
      durationSec: DURATION_SEC,
      routes: ROUTES,
    }),
  );

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(deadline, samples, errors)));

  const sorted = [...samples].sort((a, b) => a - b);
  const total = samples.length;
  const errorRate = total === 0 ? 1 : errors.length / total;

  const summary = {
    totalRequests: total,
    errors: errors.length,
    errorRate,
    p50Ms: Math.round(percentile(sorted, 50)),
    p95Ms: Math.round(percentile(sorted, 95)),
    p99Ms: Math.round(percentile(sorted, 99)),
    budgetP95Ms: 300,
    p95Pass: percentile(sorted, 95) <= 300,
    errorRatePass: errorRate < 0.001,
  };

  console.log(JSON.stringify({ scope: "load_test_ess_reads_summary", ...summary }));

  if (!summary.p95Pass || !summary.errorRatePass) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
