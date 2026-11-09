import type { NextConfig } from "next";

// Cache Components is intentionally OFF for the MVP: almost every app page is
// per-user and session-dependent, so the classic dynamic rendering model is
// simpler and less error-prone. We can revisit for marketing pages in M8.
const nextConfig: NextConfig = {
  poweredByHeader: false,
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
