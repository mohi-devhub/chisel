import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/marketplace",
        destination: "/registry",
        permanent: true,
      },
      {
        source: "/marketplace/:id",
        destination: "/registry/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
