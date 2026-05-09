// Prisma 7+ project config — load `.env` for CLI (`migrate`, `studio`, etc.).
import "dotenv/config";
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
