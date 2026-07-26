/**
 * @semantic-release/npm vendors npm@11 with brace-expansion@5.0.7 (GHSA-mh99).
 * npm overrides cannot rewrite that package's bundled tree; copy the overridden
 * brace-expansion@5.0.8 into place after install so `npm audit --audit-level=high` passes.
 */
import { cpSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "node_modules/npm/node_modules/brace-expansion");

if (!existsSync(target)) {
  process.exit(0);
}

const srcPkg = require.resolve("brace-expansion/package.json");
const srcDir = path.dirname(srcPkg);
const version = require(srcPkg).version;

if (version !== "5.0.8") {
  console.warn(
    `[patch-vendored-npm-brace] expected brace-expansion@5.0.8, found ${version}; skipping`,
  );
  process.exit(0);
}

rmSync(target, { recursive: true, force: true });
cpSync(srcDir, target, { recursive: true });
