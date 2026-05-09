/** Cosine similarity for JSON-stored embedding vectors (skills / role targets). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function parseEmbedding(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) return null;
  const nums = raw.filter((x): x is number => typeof x === "number");
  return nums.length === raw.length ? nums : null;
}

/** Weighted target vector: same dimension as employee embeddings (fixed D). */
export function buildRoleTargetVector(
  targets: { embedding: number[]; importance: number }[],
  dim: number,
): number[] {
  const acc = new Array(dim).fill(0);
  let wsum = 0;
  for (const t of targets) {
    if (t.embedding.length !== dim) continue;
    wsum += t.importance;
    for (let i = 0; i < dim; i++) {
      acc[i] += t.embedding[i] * t.importance;
    }
  }
  if (wsum === 0) return acc;
  return acc.map((x) => x / wsum);
}
