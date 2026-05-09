import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hr-erp/payroll-calc"],
  output: "standalone",
};

export default nextConfig;
