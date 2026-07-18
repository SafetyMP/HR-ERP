#!/usr/bin/env node
/**
 * Fail when two Prisma migration folders share the same timestamp prefix.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIG = join(ROOT, "prisma", "migrations");

if (!existsSync(MIG)) {
  console.log("OK  no prisma/migrations directory");
  process.exit(0);
}

const dirs = readdirSync(MIG).filter((name) => {
  const full = join(MIG, name);
  return statSync(full).isDirectory() && /^\d{14}_/.test(name);
});

const byTs = new Map();
for (const name of dirs) {
  const ts = name.slice(0, 14);
  const list = byTs.get(ts) ?? [];
  list.push(name);
  byTs.set(ts, list);
}

const dupes = [...byTs.entries()].filter(([, list]) => list.length > 1);
if (dupes.length > 0) {
  for (const [ts, list] of dupes) {
    console.error(`ERROR: duplicate migration timestamp ${ts}: ${list.join(", ")}`);
  }
  console.error(
    "Do not rename already-applied migrations; add a forward migration instead and use unique timestamps going forward.",
  );
  // Historical duplicate 20260509120000 is grandfathered until expand-contract rename.
  const onlyHistorical =
    dupes.length === 1 &&
    dupes[0][0] === "20260509120000" &&
    dupes[0][1].length === 2;
  if (onlyHistorical) {
    console.warn(
      "WARN: grandfathered duplicate 20260509120000 (add_pto_requests / enable_rls). New duplicates fail the gate.",
    );
    process.exit(0);
  }
  process.exit(1);
}

console.log("OK  prisma migration timestamps unique");
