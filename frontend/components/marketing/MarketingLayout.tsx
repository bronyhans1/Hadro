"use client";

import type { CSSProperties } from "react";
import { MarketingNav } from "./MarketingNav";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingJsonLd } from "./MarketingJsonLd";
import { MarketingAtmosphere } from "./MarketingAtmosphere";
import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { useMarketingThemeSync } from "@/lib/marketing/useMarketingThemeSync";
import { translate } from "@/lib/i18n";

type Props = {
  children: React.ReactNode;
  /** Enables coming-soon nav destinations for Stage 0 foundation review. */
  previewMode?: boolean;
};

/**
 * Public marketing shell. Apply `.mkt` scope for marketing tokens.
 * Atmosphere is scoped to main only — footer stays clean.
 */
export function MarketingLayout({ children, previewMode = false }: Props) {
  useMarketingThemeSync();

  const artVars = {
    ["--mkt-bg-art-dark" as string]: `url(${MARKETING_IMAGES.atmosphereDark})`,
    ["--mkt-bg-art-dark-fallback" as string]: `url(${MARKETING_IMAGES.atmosphereDarkFallback})`,
  } as CSSProperties;

  return (
    <div className="mkt flex min-h-screen flex-col" style={artVars}>
      <MarketingJsonLd />
      <a
        href="#mkt-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--mkt-royal)] focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        {translate("accessibility.skipToContent")}
      </a>
      <MarketingNav previewMode={previewMode} />
      <main id="mkt-main" className="mkt-main relative isolate flex-1 overflow-x-clip">
        <MarketingAtmosphere />
        <div className="relative z-[1]">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  );
}
