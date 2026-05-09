#!/usr/bin/env node
/**
 * CI helper: fail on patterns that commonly precede IDOR, SQL injection, or PII logging.
 * Not exhaustive — complements ESLint and code review.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const banned = [
  {
    re: /\$executeRawUnsafe\s*\(/,
    msg: "$executeRawUnsafe — use Prisma.sql tagged templates",
  },
  {
    re: /\$queryRawUnsafe\s*\(/,
    msg: "$queryRawUnsafe — use Prisma.sql tagged templates",
  },
  {
    re: /console\.(log|info|debug)\([\s\S]{0,120}req\.(body|query)/,
    msg: "Possible PII: logging req body/query",
  },
  {
    re: /console\.(log|info|debug)\([\s\S]{0,120}request\.(body|json)/,
    msg: "Possible PII: logging request body",
  },
];

function walk(dir, out) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (
      name === "node_modules" ||
      name === ".next" ||
      name === "generated"
    ) {
      continue;
    }
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if ([".ts", ".tsx", ".mts"].includes(extname(p))) out.push(p);
  }
  return out;
}

const targets = [
  ...walk(join(root, "app"), []),
  ...walk(join(root, "lib"), []),
];

const middlewarePath = join(root, "middleware.ts");
if (existsSync(middlewarePath)) targets.push(middlewarePath);

let failed = false;
for (const file of targets) {
  if (file.includes(`${join("app", "generated")}`)) continue;
  const content = readFileSync(file, "utf8");
  for (const { re, msg } of banned) {
    if (re.test(content)) {
      console.error(`${file}: ${msg}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("\nsecurity-scan: failed");
  process.exit(1);
}
