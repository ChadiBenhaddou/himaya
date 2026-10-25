import type { NextConfig } from "next";

/**
 * Static export for Cloudflare Pages: `next build` writes plain files to ./out.
 * The only server code is the Pages Function in functions/api/leads.ts.
 * Security headers live in public/_headers (Cloudflare applies them).
 */
const nextConfig: NextConfig = {
  output: "export",
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
