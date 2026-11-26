import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The interactive page was tried out at /3d before it became the home page.
  async redirects() {
    return [{ source: "/3d", destination: "/", permanent: false }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
