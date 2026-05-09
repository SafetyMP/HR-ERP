import { buildEmployeeScenario } from "./factory";
import type { EmployeeScenario, ScenarioTag } from "./types";

/** Mulberry32 — deterministic PRNG for CI-scale batches */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAG_POOL: ScenarioTag[] = [
  "njNyCommuter",
  "fmlaContinuous",
  "retroEquityGrantInClosedQuarter",
  "exemptNonExemptSourceConflict",
  "intermittentFmlaOverlapStd",
];

function pickTags(rand: () => number, maxTags: number): ScenarioTag[] {
  const count = 1 + Math.floor(rand() * Math.min(maxTags, TAG_POOL.length));
  const shuffled = [...TAG_POOL].sort(() => rand() - 0.5);
  return shuffled.slice(0, count);
}

export type BatchGeneratorOptions = {
  seed: number;
  count: number;
  tenantId?: string;
  /** Cap overlays per employee — defaults to 3 */
  maxTagsPerEmployee?: number;
};

/**
 * Generate large deterministic scenario batches for soak / property-style suites.
 * Persist with `scripts/qa-generate-fixture-batch.ts` → `tests/generated/` (gitignored).
 */
export function generateEmployeeScenarioBatch(options: BatchGeneratorOptions): EmployeeScenario[] {
  const rand = mulberry32(options.seed >>> 0);
  const maxTags = options.maxTagsPerEmployee ?? 3;
  const tenantId = options.tenantId ?? `tenant_batch_${options.seed}`;
  const out: EmployeeScenario[] = [];

  for (let i = 0; i < options.count; i++) {
    const tags = pickTags(rand, maxTags);
    out.push(
      buildEmployeeScenario({
        scenarioId: `batch_${options.seed}_${i}`,
        tenantId,
        tags,
        email: `batch_${options.seed}_${i}@${tenantId}.qa.local`,
      }),
    );
  }

  return out;
}
