#!/usr/bin/env node
/**
 * Lightweight import-boundary checks for lib/ domain folders.
 * See docs/architecture/lib-module-boundaries.md
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIB = join(ROOT, "lib");

/** domain -> forbidden import path prefixes (other domains) */
const FORBIDDEN_CROSS_IMPORTS = {
  payroll: ["lib/benefits/", "lib/recruiting/", "lib/engagement/"],
  benefits: ["lib/payroll/", "lib/recruiting/"],
  recruiting: ["lib/payroll/"],
  compensation: ["lib/payroll/run-payroll"],
  attendance: ["lib/payroll/"],
};

/**
 * Domains that must not mutate Core HR Employee/Organization directly.
 * Prefer lib/core-hr/writes. SCIM is an intentional second writer (IdP path).
 */
const FORBIDDEN_WRITER_MARKERS = {
  integrations: [
    "prisma.employee.upsert",
    "prisma.employee.create",
    "prisma.employee.update",
    "prisma.employee.delete",
    "tx.employee.upsert",
    "tx.employee.create",
    "tx.employee.update",
    "tx.employee.delete",
    "prisma.organization.upsert",
    "tx.organization.upsert",
  ],
  profile: [
    "prisma.employee.upsert",
    "prisma.employee.create",
    "prisma.employee.update",
    "prisma.employee.delete",
    "tx.employee.upsert",
    "tx.employee.create",
    "tx.employee.update",
    "tx.employee.delete",
  ],
  payroll: [
    "prisma.employee.upsert",
    "prisma.employee.create",
    "prisma.employee.update",
    "prisma.employee.delete",
    "tx.employee.upsert",
    "tx.employee.create",
    "tx.employee.update",
    "tx.employee.delete",
  ],
};

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules") continue;
      walk(full, acc);
    } else if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      acc.push(full);
    }
  }
  return acc;
}

function domainOf(file) {
  const rel = relative(LIB, file);
  const top = rel.split(/[/\\]/)[0];
  return top;
}

let violations = 0;

for (const file of walk(LIB)) {
  const domain = domainOf(file);
  const rules = FORBIDDEN_CROSS_IMPORTS[domain];
  const writers = FORBIDDEN_WRITER_MARKERS[domain];
  if (!rules && !writers) continue;

  // Tenant ensure shim is a thin re-export of core-hr.
  if (
    domain === "integrations" &&
    relative(LIB, file).replace(/\\/g, "/") === "integrations/tenant/ensure-org.ts"
  ) {
    continue;
  }

  const text = readFileSync(file, "utf8");
  if (rules) {
    for (const forbidden of rules) {
      if (
        text.includes(forbidden) ||
        text.includes(`@/${forbidden}`)
      ) {
        console.error(
          `BOUNDARY ${relative(ROOT, file)} imports forbidden path ${forbidden}`,
        );
        violations += 1;
      }
    }
  }
  if (writers) {
    for (const marker of writers) {
      if (text.includes(marker)) {
        console.error(
          `BOUNDARY ${relative(ROOT, file)} contains forbidden writer ${marker} — use lib/core-hr/writes`,
        );
        violations += 1;
      }
    }
  }
}

if (violations > 0) {
  console.error(
    `\n${violations} lib boundary violation(s). See docs/architecture/lib-module-boundaries.md`,
  );
  process.exit(1);
}

console.log("OK  lib/ module boundary scan passed");
