// Prisma 7+ project config (load `.env` via your shell, Next.js, or `dotenv` in app code).
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx scripts/seed-predictive-demo.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
