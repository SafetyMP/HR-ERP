import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/tests": path.resolve(__dirname, "tests"),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/app": path.resolve(__dirname, "src/app"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/vitest.setup.ts"],
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "packages/**"],
    globals: false,
    retry: 0,
  },
});
