import type { NextConfig } from "next";

// GitHub project Pages uses a case-sensitive repository path. Use an empty
// DEMO_BASE_PATH for a domain-root preview, or set it to the deployment path.
const basePath = process.env.DEMO_BASE_PATH ?? "/HR-ERP";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
