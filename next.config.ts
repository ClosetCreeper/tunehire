import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 👇 This is all you actually need to tell Next.js your app is in /src
  experimental: {
    // No need for `appDir`, it's auto-detected now.
  },
  // 👇 Tell Next.js your source directory is /src
  // (this only matters if you’re using `pages/`, but it's fine to add)
  // No longer necessary in app-router projects, so this can even be skipped!
};

export default nextConfig;
