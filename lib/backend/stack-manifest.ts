/**
 * Canonical backend stack for HR ERP APIs — JSON over HTTPS under `/api/v1`.
 * Monorepo layout: Next.js App Router (route handlers) + Prisma + Postgres + Redis.
 */
export const API_VERSION = "v1" as const;

export const STACK = {
  apiStyle: "rest-json",
  versioning: "path-/api/v1",
  framework: "next.js-app-router",
  orm: "prisma-7-pg-adapter",
  database: "postgresql-16",
  cacheQueue: "redis-7-ioredis-bullmq",
  validation: "zod",
  authJwt: "jose-hs256",
} as const;
