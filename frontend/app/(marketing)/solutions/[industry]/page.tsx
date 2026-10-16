import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SolutionIndustryPage } from "@/components/marketing/SolutionIndustryPage";
import { LANDING_INDUSTRIES } from "@/lib/marketing/siteConfig";
import { getIndustrySolution } from "@/lib/marketing/solutionsContent";
import { createMarketingMetadata, industrySeo } from "@/lib/marketing/seo";

type PageProps = {
  params: { industry: string };
};

export function generateStaticParams() {
  return LANDING_INDUSTRIES.map((item) => ({ industry: item.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const seo = industrySeo(params.industry);
  if (!seo) {
    return createMarketingMetadata({
      title: "Solution not found",
      description: "This industry solution page could not be found.",
      path: `/solutions/${params.industry}`,
      noIndex: true,
    });
  }
  return createMarketingMetadata(seo);
}

/**
 * Stage 3 — individual industry solution pages.
 * Content is centralized in solutionsContent.ts; this route only resolves the industry.
 */
export default function IndustrySolutionRoute({ params }: PageProps) {
  const solution = getIndustrySolution(params.industry);
  if (!solution) notFound();
  return <SolutionIndustryPage solution={solution} />;
}
