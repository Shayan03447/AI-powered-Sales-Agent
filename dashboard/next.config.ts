import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Old /review route permanently redirects to /drafts
        source: "/review",
        destination: "/drafts",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
