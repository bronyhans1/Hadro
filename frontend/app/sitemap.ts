import type { MetadataRoute } from "next";
import { listMarketingSitemapPaths, marketingAbsoluteUrl } from "@/lib/marketing/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return listMarketingSitemapPaths().map((path) => ({
    url: marketingAbsoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/solutions") ? 0.8 : 0.7,
  }));
}
