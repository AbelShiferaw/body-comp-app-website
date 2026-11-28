import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The tour used to be previewed at /v2 and /3d; it is the home page now.
  // Temporary (307) so the paths stay free for later use.
  async redirects() {
    return [
      { source: "/v2", destination: "/", permanent: false },
      { source: "/3d", destination: "/", permanent: false },
    ];
  },
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
