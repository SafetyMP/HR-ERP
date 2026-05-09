import type { NextConfig } from "next";

// `output: "standalone"` was previously set here, but on Vercel deploys it
// causes Next.js to bake an `.env` file into `.next/standalone/` that captures
// any environment values exposed at build time. For Vercel-typed `sensitive`
// secrets (which are intentionally NOT exposed at build), the bake captured an
// empty string and shadowed Vercel's runtime env injection — producing the
// historical `JWT_SECRET=""` runtime read documented in
// `docs/operations/vercel-managed-phase1-environment.md`. Standalone output is
// for self-hosted Docker deploys; Vercel does not need it. Removing it lets
// Vercel's runtime env injection be the single source of truth.
const nextConfig: NextConfig = {
  transpilePackages: ["@hr-erp/payroll-calc"],
};

export default nextConfig;
