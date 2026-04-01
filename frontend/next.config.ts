import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable x-powered-by header
  poweredByHeader: false,
  // All routes are auth-protected; static generation has no benefit
  // Compress responses
  compress: true,
};

export default nextConfig;
