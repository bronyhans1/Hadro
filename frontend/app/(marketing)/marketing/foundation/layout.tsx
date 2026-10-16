import type { Metadata } from "next";
import { createMarketingMetadata, MARKETING_SEO } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  ...MARKETING_SEO.foundationPreview,
  noIndex: true,
});

export default function FoundationPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
