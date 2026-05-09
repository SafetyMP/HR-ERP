#!/usr/bin/env npx tsx
/**
 * Writes a deterministic mega-batch to tests/generated/ (gitignored).
 * Usage: npx tsx scripts/qa-generate-fixture-batch.ts --seed=12345 --count=5000
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { generateEmployeeScenarioBatch } from "../tests/fixtures/employees/batch-generator";

function parseArgs(): { seed: number; count: number } {
  const argv = process.argv.slice(2);
  let seed = 12345;
  let count = 1000;
  for (const a of argv) {
    if (a.startsWith("--seed=")) seed = Number(a.split("=")[1]);
    if (a.startsWith("--count=")) count = Number(a.split("=")[1]);
  }
  if (!Number.isFinite(seed) || !Number.isFinite(count) || count < 1) {
    throw new Error("Invalid --seed or --count");
  }
  return { seed, count };
}

const { seed, count } = parseArgs();
const batch = generateEmployeeScenarioBatch({ seed, count });
const outDir = path.join(process.cwd(), "tests", "generated");
fs.mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `employees_seed_${seed}_n_${count}.json`);
fs.writeFileSync(file, JSON.stringify(batch, null, 0), "utf8");
console.log(`Wrote ${batch.length} scenarios → ${file}`);
