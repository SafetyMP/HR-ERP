#!/usr/bin/env node
/**
 * Wrapper for `prisma db push` — requires CONFIRM_DB_PUSH=1 when DATABASE_URL is not local.
 */
import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
const isLocal =
  !url ||
  /localhost|127\.0\.0\.1|postgresql:\/\/ci:ci@/i.test(url);

if (!isLocal && process.env.CONFIRM_DB_PUSH !== "1") {
  console.error(
    "ERROR: prisma db push against non-local DATABASE_URL requires CONFIRM_DB_PUSH=1",
  );
  process.exit(1);
}

const r = spawnSync("npx", ["prisma", "db", "push", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
