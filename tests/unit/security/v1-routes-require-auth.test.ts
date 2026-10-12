import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(process.cwd(), "src/app/api/v1");
const AUTH_MARKER = /safeRouteAuth|requireBearerAuth|defineV1Route/;

async function routeFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await routeFiles(full)));
    } else if (entry.name === "route.ts") {
      files.push(full);
    }
  }
  return files;
}

describe("v1 routes verify the bearer on the Node runtime", () => {
  it("every route.ts calls safeRouteAuth, requireBearerAuth, or defineV1Route", async () => {
    const files = await routeFiles(ROOT);
    expect(files.length).toBeGreaterThan(0);
    const missing: string[] = [];
    for (const file of files) {
      const text = await readFile(file, "utf8");
      if (!AUTH_MARKER.test(text)) {
        missing.push(path.relative(process.cwd(), file));
      }
    }
    expect(missing).toEqual([]);
  });
});
