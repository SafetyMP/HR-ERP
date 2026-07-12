import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths({ root })],
  test: {
    environment: "happy-dom",
    include: ["tests/unit/components/**/*.test.tsx"],
    globals: false,
  },
});
