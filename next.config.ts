import type { NextConfig } from "next";

const apiOrigin = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3007"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  images: {
    // Vinext/Workers: layanan `/_next/image` sering tidak tersedia di server produksi;
    // aset di `public/` dilayani langsung (/brand/logo.png).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3007",
        pathname: "/ads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3007",
        pathname: "/ads/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
