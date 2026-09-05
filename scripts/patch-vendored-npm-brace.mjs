/**
 * @semantic-release/npm vendors npm with bundled brace-expansion / ip-address / tar
 * that npm overrides cannot rewrite. Copy hoisted patched copies into place
 * after install so `npm audit --audit-level=high` passes.
 */
import { cpSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function patchVendored(pkgName, expectedVersion) {
  const target = path.join(root, "node_modules/npm/node_modules", pkgName);
  if (!existsSync(target)) {
    return;
  }

  let srcPkg;
  try {
    srcPkg = require.resolve(`${pkgName}/package.json`);
  } catch {
    console.warn(
      `[patch-vendored-npm-brace] hoisted ${pkgName} missing; skipping`,
    );
    return;
  }
  const srcDir = path.dirname(srcPkg);
  const version = require(srcPkg).version;

  if (version !== expectedVersion) {
    console.warn(
      `[patch-vendored-npm-brace] expected ${pkgName}@${expectedVersion}, found ${version}; skipping`,
    );
    return;
  }

  rmSync(target, { recursive: true, force: true });
  cpSync(srcDir, target, { recursive: true });
}

patchVendored("brace-expansion", "5.0.9");
patchVendored("ip-address", "10.5.0");
patchVendored("tar", "7.5.22");
