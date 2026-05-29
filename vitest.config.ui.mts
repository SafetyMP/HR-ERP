import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/lib": path.resolve(__dirname, "lib"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["tests/unit/components/**/*.test.tsx"],
    globals: false,
  },
});
