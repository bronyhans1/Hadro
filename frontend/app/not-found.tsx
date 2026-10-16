import type { Metadata } from "next";
import { MarketingNotFound } from "@/components/marketing/MarketingNotFound";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Page not found",
  description: "The page you requested could not be found on HADRO.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return <MarketingNotFound />;
}
