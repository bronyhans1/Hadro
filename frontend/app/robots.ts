import type { MetadataRoute } from "next";
import { MARKETING } from "@/lib/marketing/siteConfig";
import { marketingAbsoluteUrl } from "@/lib/marketing/seo";

/**
 * Public crawler rules for the HADRO website.
 * Allow marketing surfaces; keep authenticated app areas out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/platform/",
          "/admin/",
          "/settings",
          "/profile",
          "/employees",
          "/attendance",
          "/payroll",
          "/leave",
          "/reports",
          "/notifications",
          "/branches",
          "/departments",
          "/audit",
          "/marketing/foundation",
          "/login",
          "/reset-password",
          "/set-password",
        ],
      },
    ],
    sitemap: marketingAbsoluteUrl("/sitemap.xml"),
    host: MARKETING.siteUrl.replace(/\/$/, ""),
  };
}
