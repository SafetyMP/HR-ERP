#!/usr/bin/env node
/**
 * Ensures every v1 route.ts exports HTTP methods with matching route-policies.ts entries.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name === "route.ts") out.push(p);
  }
  return out;
}

function routePathFromFile(filePath) {
  const rel = filePath.replace(join(root, "src", "app"), "").replace(/\\/g, "/");
  const segments = rel.split("/").filter(Boolean);
  segments.pop();
  const parts = segments.map((seg) =>
    seg.startsWith("[") && seg.endsWith("]") ? `:${seg.slice(1, -1)}` : seg,
  );
  return `/${parts.join("/")}`;
}

function methodsInRoute(filePath) {
  const content = readFileSync(filePath, "utf8");
  const methods = [];
  for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    if (new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(content)) {
      methods.push(m);
    }
  }
  return methods;
}

const policiesPath = join(root, "lib", "security", "route-policies.ts");
const policiesContent = readFileSync(policiesPath, "utf8");
const policyKeys = new Set();
for (const match of policiesContent.matchAll(/routeKey\("([A-Z]+)",\s*"([^"]+)"\)/g)) {
  policyKeys.add(`${match[1]} ${match[2]}`);
}

const v1Root = join(root, "src", "app", "api", "v1");
const routes = walk(v1Root);
const missing = [];

for (const file of routes) {
  const pathname = routePathFromFile(file);
  for (const method of methodsInRoute(file)) {
    const key = `${method} ${pathname}`;
    if (!policyKeys.has(key)) {
      missing.push({ file, key });
    }
  }
}

if (missing.length > 0) {
  console.error("route-policy-parity: missing registry entries:\n");
  for (const { file, key } of missing) {
    console.error(`  ${key}  (${file.replace(root + "/", "")})`);
  }
  process.exit(1);
}

console.log(`route-policy-parity: ok (${routes.length} route files)`);
