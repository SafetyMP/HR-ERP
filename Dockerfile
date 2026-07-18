# Builder uses Debian Bookworm (glibc) so Prisma engines match the distroless Debian 12 runtime.
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/payroll-calc/package.json ./packages/payroll-calc/
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 \
    DOCKER_BUILD=1 \
    DATABASE_URL="postgresql://ci:ci@localhost:5432/ci" \
    JWT_SECRET="ci-docker-build-placeholder-32-chars-minimum-xx"
RUN npx prisma generate
RUN npm run build

# Distroless: no shell or package manager; nonroot UID/GID 65532
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
WORKDIR /app
# Do not bake ALLOW_HS256_IN_PRODUCTION here — production must use JWT_ISSUER_MODE=jwks|oidc
# unless an orchestrator explicitly injects break-glass at deploy time.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=65532:65532 /app/public ./public
COPY --from=builder --chown=65532:65532 /app/.next/standalone ./
COPY --from=builder --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=builder --chown=65532:65532 /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=65532:65532 /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
# Distroless has no shell; orchestrators should HTTP-probe /api/health.
CMD ["server.js"]

