import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

if (!process.env.DATABASE_URL && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const raw = match[1].trim().replace(/^['"]|['"]$/g, "");
    if (raw) process.env.DATABASE_URL = raw;
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is required. From this repo: docker compose up -d postgres, copy .env.example to .env, then npm run tenancy.",
  );
  process.exit(1);
}

const child = spawnSync(
  "npx",
  ["vitest", "run", "tests/integration/security/employee-rls-cross-tenant.integration.test.ts"],
  { stdio: "inherit" },
);
process.exit(child.status ?? 1);
