#!/usr/bin/env node
// CI helper: ensure every `/api/v1/**` route handler is documented in
// `contracts/openapi/core-hr-v1.yaml`. Exits non-zero on drift so that
// implementations cannot silently outpace the OpenAPI contract.

import { readFile, readdir } from "node:fs/promises";
import { resolve, relative, sep, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const apiRoot = resolve(repoRoot, "src/app/api/v1");
const openapiPath = resolve(repoRoot, "contracts/openapi/core-hr-v1.yaml");

const HTTP_VERBS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

function routeFileToOpenapiPath(file) {
  const rel = relative(apiRoot, file).split(sep);
  rel.pop(); // route.ts
  if (rel.length === 0) return "/";
  const segments = rel.map((segment) => {
    if (segment.startsWith("[") && segment.endsWith("]")) {
      const name = segment.slice(1, -1).replace(/^\.\.\./, "");
      return `{${name}}`;
    }
    return segment;
  });
  return `/${segments.join("/")}`;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (entry.isFile() && entry.name === "route.ts") {
      files.push(path);
    }
  }
  return files;
}

async function readVerbsForFile(file) {
  const source = await readFile(file, "utf8");
  const verbs = new Set();
  for (const verb of HTTP_VERBS) {
    const re = new RegExp(`export\\s+(?:async\\s+)?function\\s+${verb}\\b`);
    if (re.test(source)) verbs.add(verb);
  }
  return verbs;
}

function parseOpenapiPaths(yaml) {
  const out = new Map();
  const lines = yaml.split("\n");
  let inPaths = false;
  let currentPath = null;
  let baseIndent = null;

  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;

    if (!inPaths) {
      if (rawLine.startsWith("paths:")) inPaths = true;
      continue;
    }

    const indentMatch = rawLine.match(/^(\s*)\S/);
    if (!indentMatch) continue;
    const indent = indentMatch[1].length;

    if (indent === 0 && !rawLine.startsWith("paths:")) {
      // moved to top-level sibling key (components, etc.)
      break;
    }

    if (baseIndent === null && indent > 0) {
      baseIndent = indent;
    }

    if (indent === baseIndent && rawLine.trim().endsWith(":")) {
      const key = rawLine.trim().slice(0, -1);
      if (key.startsWith("/")) {
        currentPath = key;
        if (!out.has(currentPath)) out.set(currentPath, new Set());
      } else {
        currentPath = null;
      }
      continue;
    }

    if (currentPath && indent === baseIndent + 2 && rawLine.trim().endsWith(":")) {
      const verbCandidate = rawLine.trim().slice(0, -1).toUpperCase();
      if (HTTP_VERBS.has(verbCandidate)) {
        out.get(currentPath).add(verbCandidate);
      }
    }
  }

  return out;
}

const files = await walk(apiRoot);
const handlerByPath = new Map();
for (const file of files) {
  const openapiPathKey = routeFileToOpenapiPath(file);
  const verbs = await readVerbsForFile(file);
  const existing = handlerByPath.get(openapiPathKey) ?? new Set();
  for (const v of verbs) existing.add(v);
  handlerByPath.set(openapiPathKey, existing);
}

const yaml = await readFile(openapiPath, "utf8");
const documented = parseOpenapiPaths(yaml);

const missing = [];
for (const [path, verbs] of handlerByPath) {
  const documentedVerbs = documented.get(path) ?? new Set();
  for (const verb of verbs) {
    if (!documentedVerbs.has(verb)) {
      missing.push({ path, verb });
    }
  }
}

const orphanPaths = [];
for (const [path, verbs] of documented) {
  if (!handlerByPath.has(path)) {
    orphanPaths.push({ path, verbs: [...verbs] });
  }
}

if (missing.length === 0 && orphanPaths.length === 0) {
  console.log(
    `OK — ${handlerByPath.size} route handlers documented across ${documented.size} OpenAPI paths`,
  );
  process.exit(0);
}

if (missing.length > 0) {
  console.error("Routes missing from contracts/openapi/core-hr-v1.yaml:");
  for (const { path, verb } of missing.sort((a, b) =>
    a.path.localeCompare(b.path),
  )) {
    console.error(`  - ${verb} ${path}`);
  }
}
if (orphanPaths.length > 0) {
  console.error(
    "OpenAPI paths without a corresponding route handler (likely stale):",
  );
  for (const { path, verbs } of orphanPaths.sort((a, b) =>
    a.path.localeCompare(b.path),
  )) {
    console.error(`  - ${path} (${verbs.join(",")})`);
  }
}

process.exit(1);
