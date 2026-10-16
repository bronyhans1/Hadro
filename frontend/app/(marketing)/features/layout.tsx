import type { Metadata } from "next";
import { createMarketingMetadata, MARKETING_SEO } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata(MARKETING_SEO.features);

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
