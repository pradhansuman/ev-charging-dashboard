import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "https://preview-web-ec5039f3-82af-4f61-95b4-937c4c925e2a.space-z.ai",
    "https://preview-chat-e46229a9-109d-486b-84dd-38fb4d4b132e.space-z.ai",
  ],
};

export default nextConfig;