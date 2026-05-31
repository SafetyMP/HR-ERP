#!/usr/bin/env node
/**
 * governance-evidence — Evidence plane bundle collect/verify (ADR 0019)
 *
 * Usage:
 *   node governance-evidence.mjs collect --handoff path --principal name [--out path]
 *   node governance-evidence.mjs verify [--handoff path] [--discover] [--strict]
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadManifest, tierAtLeast } from "./governance-manifest.mjs";

function repoRoot() {
  return process.cwd();
}

function evidenceRoot() {
  return join(repoRoot(), "specs", "governance", "evidence");
}

function hashContent(content) {
  return createHash("sha256").update(content).digest("hex");
}

function hashFile(fp) {
  if (!existsSync(fp)) return null;
  return hashContent(readFileSync(fp));
}

function hashFileTail(fp, lineCount = 50) {
  if (!existsSync(fp)) return null;
  const tail = readFileSync(fp, "utf8").split("\n").slice(-lineCount).join("\n");
  return hashContent(tail);
}

function validateEvidenceBundle(doc) {
  const issues = [];
  if (!doc.bundleId) issues.push("bundleId required");
  if (!doc.handoffPath) issues.push("handoffPath required");
  if (!doc.principal?.trim()) issues.push("principal required");
  if (!doc.generatedAt) issues.push("generatedAt required");
  if (doc.attestationVersion !== 1) issues.push("attestationVersion must be 1");
  if (
    doc.sessionLaneStateHash &&
    !/^[a-f0-9]{64}$/.test(doc.sessionLaneStateHash)
  ) {
    issues.push("sessionLaneStateHash must be sha256 hex");
  }
  if (doc.auditLogTailHash && !/^[a-f0-9]{64}$/.test(doc.auditLogTailHash)) {
    issues.push("auditLogTailHash must be sha256 hex");
  }
  return { ok: issues.length === 0, issues };
}

function validateLaneSignoff(doc) {
  const issues = [];
  if (!doc.handoffId) issues.push("handoffId required");
  if (!doc.ticketId) issues.push("ticketId required");
  if (!doc.principal?.trim()) issues.push("principal required");
  if (!doc.generatedAt) issues.push("generatedAt required");
  if (!Array.isArray(doc.lanes) || doc.lanes.length === 0) {
    issues.push("lanes array required");
  } else {
    for (const lane of doc.lanes) {
      if (!lane.function) issues.push("lane.function required");
      if (!lane.verifier?.trim()) issues.push(`lane ${lane.function}: verifier required`);
      if (!lane.signedAt) issues.push(`lane ${lane.function}: signedAt required`);
    }
  }
  return { ok: issues.length === 0, issues };
}

function walkHandoffs(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkHandoffs(p, out);
    else if (name.endsWith(".json") && name.includes("orchestrator")) out.push(p);
  }
  return out;
}

function discoverHandoffs() {
  const specsDir = join(repoRoot(), "specs");
  return walkHandoffs(specsDir, []).filter(
    (p) => !p.includes(`${join("specs", "templates")}`) && !p.endsWith(".schema.json"),
  );
}

function ciRunUrl() {
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (repo && runId) return `${server}/${repo}/actions/runs/${runId}`;
  return null;
}

function cmdCollect(args) {
  if (!args.handoff || !args.principal) {
    console.error("collect requires --handoff and --principal");
    return 1;
  }
  const handoffPath = args.handoff.replace(repoRoot() + "/", "");
  const handoffAbs = join(repoRoot(), handoffPath);
  if (!existsSync(handoffAbs)) {
    console.error(`handoff not found: ${handoffAbs}`);
    return 1;
  }
  const handoff = JSON.parse(readFileSync(handoffAbs, "utf8"));
  const bundleId = handoff.ticketId ?? handoffPath.replace(/[^\w-]+/g, "-");

  const sessionPath = join(repoRoot(), ".cursor", "hooks-output", "session-lane-state.json");
  const auditPath = join(repoRoot(), ".cursor", "hooks-output", "audit.log");

  const bundle = {
    bundleId,
    handoffPath,
    sessionLaneStateHash: hashFile(sessionPath),
    auditLogTailHash: hashFileTail(auditPath, 50),
    ciRunUrl: ciRunUrl(),
    principal: args.principal,
    generatedAt: new Date().toISOString(),
    attestationVersion: 1,
    laneSignoffPath: args.laneSignoff ?? null,
    signature: null,
  };

  const { ok, issues } = validateEvidenceBundle(bundle);
  if (!ok) {
    console.error(`Invalid bundle: ${issues.join("; ")}`);
    return 1;
  }

  const outDir = join(evidenceRoot(), "bundles");
  mkdirSync(outDir, { recursive: true });
  const outPath = args.out
    ? join(repoRoot(), args.out)
    : join(outDir, `${bundleId}.json`);

  writeFileSync(outPath, JSON.stringify(bundle, null, 2));
  console.log(`Evidence bundle: ${outPath.replace(repoRoot() + "/", "")}`);
  return 0;
}

function verifyBundleAtPath(bundlePath, { strict, manifest }) {
  if (!existsSync(bundlePath)) {
    return { ok: false, issues: [`evidence bundle not found: ${bundlePath}`] };
  }
  const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));
  const { ok, issues } = validateEvidenceBundle(bundle);
  if (!ok) return { ok: false, issues };

  const handoffAbs = join(repoRoot(), bundle.handoffPath);
  if (!existsSync(handoffAbs)) {
    issues.push(`handoff missing: ${bundle.handoffPath}`);
  }

  const sessionPath = join(repoRoot(), ".cursor", "hooks-output", "session-lane-state.json");
  const auditPath = join(repoRoot(), ".cursor", "hooks-output", "audit.log");

  if (bundle.sessionLaneStateHash && existsSync(sessionPath)) {
    const current = hashFile(sessionPath);
    if (current !== bundle.sessionLaneStateHash) {
      if (strict) issues.push("sessionLaneStateHash mismatch (session state changed since collect)");
      else console.warn("WARN: sessionLaneStateHash mismatch");
    }
  }

  if (bundle.auditLogTailHash && existsSync(auditPath)) {
    const current = hashFileTail(auditPath, 50);
    if (current !== bundle.auditLogTailHash) {
      if (strict) issues.push("auditLogTailHash mismatch");
      else console.warn("WARN: auditLogTailHash mismatch");
    }
  }

  if (bundle.laneSignoffPath) {
    const signoffPath = join(repoRoot(), bundle.laneSignoffPath);
    if (!existsSync(signoffPath)) {
      issues.push(`lane signoff missing: ${bundle.laneSignoffPath}`);
    } else {
      const signoff = JSON.parse(readFileSync(signoffPath, "utf8"));
      const signoffCheck = validateLaneSignoff(signoff);
      if (!signoffCheck.ok) issues.push(...signoffCheck.issues.map((i) => `signoff: ${i}`));

      if (manifest && handoffAbs && existsSync(handoffAbs)) {
        const handoff = JSON.parse(readFileSync(handoffAbs, "utf8"));
        const plan = handoff.delegatedTaskPlan ?? [];
        const required = new Set(plan.map((p) => p.function).filter(Boolean));
        const attested = new Set(signoff.lanes.map((l) => l.function));
        for (const lane of required) {
          if (!attested.has(lane)) {
            issues.push(`lane signoff missing required lane: ${lane}`);
          }
        }
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

function cmdVerify(args) {
  let exit = 0;
  const manifest = loadManifest();
  const fixture = join(evidenceRoot(), "fixtures", "valid-evidence-bundle.json");
  const paths = [];

  if (args.file) paths.push(resolve(args.file));
  else if (args.handoff) {
    const handoff = JSON.parse(readFileSync(join(repoRoot(), args.handoff), "utf8"));
    if (handoff.evidenceBundlePath) paths.push(join(repoRoot(), handoff.evidenceBundlePath));
  } else {
    paths.push(fixture);
    if (args.discover) {
      for (const hp of discoverHandoffs()) {
        const data = JSON.parse(readFileSync(hp, "utf8"));
        if (data.evidenceBundlePath) {
          paths.push(join(repoRoot(), data.evidenceBundlePath));
        } else if (args.strict && tierAtLeast(data.riskTier, "T3")) {
          console.error(`ERROR: T3+ handoff missing evidenceBundlePath: ${hp}`);
          exit = 1;
        }
      }
    }
  }

  for (const fp of [...new Set(paths)]) {
    if (!existsSync(fp)) continue;
    const { ok, issues } = verifyBundleAtPath(fp, { strict: args.strict, manifest });
    if (ok) console.log(`OK: ${fp}`);
    else {
      console.error(`FAIL: ${fp}: ${issues.join("; ")}`);
      exit = 1;
    }
  }

  const signoffFixture = join(evidenceRoot(), "fixtures", "valid-lane-signoff.json");
  if (existsSync(signoffFixture)) {
    const doc = JSON.parse(readFileSync(signoffFixture, "utf8"));
    const { ok, issues } = validateLaneSignoff(doc);
    if (ok) console.log(`OK: ${signoffFixture}`);
    else {
      console.error(`FAIL: ${signoffFixture}: ${issues.join("; ")}`);
      exit = 1;
    }
  }

  return exit;
}

function parseArgs(argv) {
  const args = {
    command: "verify",
    strict: false,
    discover: false,
    handoff: null,
    principal: null,
    out: null,
    file: null,
    laneSignoff: null,
  };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict") args.strict = true;
    else if (a === "--discover") args.discover = true;
    else if (a === "--handoff") args.handoff = argv[++i];
    else if (a === "--principal") args.principal = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--file") args.file = argv[++i];
    else if (a === "--lane-signoff") args.laneSignoff = argv[++i];
    else positional.push(a);
  }
  if (positional[0]) args.command = positional[0];
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.command === "collect") return cmdCollect(args);
  if (args.command === "verify") return cmdVerify(args);
  console.error(`Unknown command: ${args.command}`);
  return 1;
}

process.exit(await main());
