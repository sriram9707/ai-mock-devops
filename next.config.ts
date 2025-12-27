import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/vapi/chat/chat/completions',
        destination: '/api/vapi/chat',
      },
    ]
  },
};

export default nextConfig;
