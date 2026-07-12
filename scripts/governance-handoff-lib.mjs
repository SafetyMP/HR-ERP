/**
 * Shared handoff discovery for governance-lint, audit, and enforcement profile resolver.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";

export function repoRoot() {
  return process.cwd();
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function walkJsonFiles(dir, out) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkJsonFiles(p, out);
    else if (name.endsWith(".json") && name.includes("orchestrator"))
      out.push(p);
  }
  return out;
}

export function discoverHandoffFiles(root = repoRoot()) {
  const specsDir = join(root, "specs");
  return walkJsonFiles(specsDir, []).filter(
    (p) =>
      !p.includes(join("specs", "templates")) && !p.endsWith(".schema.json"),
  );
}

/**
 * Nearest orchestrator-handoff.json for cwd (feature folder, walk-up, or longest prefix match).
 * @param {string} [cwd]
 * @returns {{ path: string, data: Record<string, unknown> } | null}
 */
export function findHandoffForCwd(cwd = process.cwd(), root = repoRoot()) {
  const absCwd = resolve(cwd);
  const rel = relative(root, absCwd).replace(/\\/g, "/");

  const featureMatch = rel.match(/^specs\/features\/([^/]+)/);
  if (featureMatch) {
    const candidate = join(
      root,
      "specs",
      "features",
      featureMatch[1],
      "orchestrator-handoff.json",
    );
    const data = readJson(candidate);
    if (data) return { path: candidate, data };
  }

  let dir = absCwd;
  const rootAbs = resolve(root);
  while (dir.startsWith(rootAbs) && dir !== rootAbs) {
    const candidate = join(dir, "orchestrator-handoff.json");
    const data = readJson(candidate);
    if (data) return { path: candidate, data };
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  const discovered = discoverHandoffFiles(root);
  let best = null;
  let bestLen = -1;
  for (const fp of discovered) {
    const handoffDir = dirname(fp).replace(/\\/g, "/");
    const normRel = rel.startsWith(handoffDir) ? rel : "";
    if (normRel && handoffDir.length > bestLen) {
      const data = readJson(fp);
      if (data) {
        best = { path: fp, data };
        bestLen = handoffDir.length;
      }
    }
  }
  return best;
}
