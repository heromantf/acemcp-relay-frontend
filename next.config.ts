import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "linux.do",
      },
      {
        protocol: "https",
        hostname: "*.linux.do",
      },
      {
        protocol: "https",
        hostname: "cdn.linux.do",
      },
    ],
  },
};

export default nextConfig;
