/**
 * Handoff ↔ diff path matching for governance-lint and tests.
 */
import { dirname, relative, resolve } from "node:path";

/**
 * Simple glob: ** and * only; patterns relative to repo root.
 */
export function matchGlob(filePath, pattern) {
  const norm = filePath.replace(/\\/g, "/");
  const pat = pattern.replace(/\\/g, "/");
  if (pat.endsWith("/**")) {
    const prefix = pat.slice(0, -3);
    return norm === prefix || norm.startsWith(`${prefix}/`);
  }
  if (pat.endsWith("**")) {
    const prefix = pat.slice(0, -2);
    return norm.startsWith(prefix);
  }
  const re = new RegExp(
    `^${pat.replace(/\./g, "\\.").replace(/\*\*/g, "§§").replace(/\*/g, "[^/]*").replace(/§§/g, ".*")}$`,
  );
  return re.test(norm);
}

/**
 * @param {string} handoffPath absolute or relative to cwd
 * @param {string[]} diffFiles repo-relative paths
 * @param {{ suspectedPaths?: string[] }} handoffData optional parsed handoff
 */
export function handoffCoversDiff(handoffPath, diffFiles, handoffData = null) {
  if (!diffFiles?.length) return true;

  const handoffDir = dirname(handoffPath).replace(/\\/g, "/");
  const handoffRel = handoffDir.startsWith("specs/") ? handoffDir : relative(process.cwd(), handoffDir).replace(/\\/g, "/");

  for (const f of diffFiles) {
    const norm = f.replace(/\\/g, "/");
    if (norm.startsWith(`${handoffRel}/`) || norm === handoffRel) return true;
  }

  const patterns = handoffData?.suspectedPaths ?? [];
  for (const f of diffFiles) {
    for (const p of patterns) {
      if (matchGlob(f, p)) return true;
    }
  }

  return false;
}

/**
 * @param {string[]} handoffPaths
 * @param {string[]} diffFiles
 * @param {(path: string) => object|null} loadHandoff
 */
export function anyHandoffCoversDiff(handoffPaths, diffFiles, loadHandoff) {
  if (!diffFiles.length) return { ok: true, matched: null };
  for (const fp of handoffPaths) {
    const data = loadHandoff ? loadHandoff(fp) : null;
    if (handoffCoversDiff(fp, diffFiles, data)) return { ok: true, matched: fp };
  }
  return { ok: false, matched: null };
}
