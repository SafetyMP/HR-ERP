import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/tests": path.resolve(__dirname, "tests"),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/app": path.resolve(__dirname, "src/app"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // Neon targets Next's bundler-resolved subpaths; inline it so tests use
    // the same resolution and can supply an isolated Next request context.
    server: { deps: { inline: ["@neondatabase/auth"] } },
    environment: "node",
    setupFiles: ["./tests/vitest.setup.ts"],
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "packages/**"],
    globals: false,
    retry: 0,
  },
});
