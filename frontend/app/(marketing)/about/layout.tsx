import type { Metadata } from "next";
import { createMarketingMetadata, MARKETING_SEO } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata(MARKETING_SEO.about);

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
