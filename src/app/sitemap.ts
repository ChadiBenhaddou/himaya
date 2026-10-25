import type { MetadataRoute } from "next";

// Generated once at build time (static export for Cloudflare Pages).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) return [];
  return [{ url: siteUrl.replace(/\/$/, "") + "/", changeFrequency: "monthly", priority: 1 }];
}
