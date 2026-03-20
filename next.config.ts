import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

import "./src/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  eslint: { ignoreDuringBuilds: true },
  // Exclude problematic routes from static generation
  experimental: {
    // Skip static generation for routes with client component issues
    skipTrailingSlashRedirect: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iiazjw8b8a.ufs.sh",
        port: "",
        pathname: "/f/**",
      },
    ],
  },
};

export default config;

