import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/crm.html",
        destination: "/crm",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
