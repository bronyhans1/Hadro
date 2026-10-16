import type { Metadata } from "next";
import { createMarketingMetadata, MARKETING_SEO } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata(MARKETING_SEO.contact);

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
