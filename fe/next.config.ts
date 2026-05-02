import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@topcv/shared"],
  turbopack: {
    root: workspaceRoot,
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
        ],
      },
    ];
  },
  async rewrites() {
    const apiTarget = (process.env.API_PROXY_TARGET ?? "http://localhost:3000").replace(/\/$/, "");
    return [
      // Proxy oRPC as well (used by some features/tests).
      {
        source: "/rpc/:path*",
        destination: `${apiTarget}/rpc/:path*`,
      },
    ];
  },
};

export default nextConfig;
