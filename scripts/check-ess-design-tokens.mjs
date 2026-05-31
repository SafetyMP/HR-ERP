#!/usr/bin/env node
/**
 * Enforce brief 022 UAC7: employee ESS routes use design tokens, not zinc-* utilities.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = join(ROOT, "src/app/employee");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(tsx|jsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const violations = [];
for (const file of walk(TARGET)) {
  const rel = file.slice(ROOT.length + 1);
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (/\bzinc-/.test(line)) {
      violations.push(`${rel}:${i + 1}`);
    }
  });
}

if (violations.length > 0) {
  console.error("ESS design token check failed — zinc-* found on employee routes:\n");
  for (const v of violations) {
    console.error(`  ${v}`);
  }
  console.error("\nUse border-border, bg-background, text-foreground, text-muted-foreground instead.");
  process.exit(1);
}

console.log(`OK  ESS design tokens (${walk(TARGET).length} files under src/app/employee)`);
