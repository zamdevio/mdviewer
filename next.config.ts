import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  // Expose environment variables for static export
  // These will be replaced at build time
  env: {
    API_URL: process.env.API_URL || '',
    FRONTEND_URL: process.env.FRONTEND_URL || '',
  },
};

export default nextConfig;
