import { BRAND } from "@/lib/branding";
import { MARKETING, MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { marketingAbsoluteUrl } from "@/lib/marketing/seo";
import { marketingText } from "@/lib/marketing/text";

/** Organization + WebSite JSON-LD for public marketing surfaces. */
export function MarketingJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: BRAND.appName,
        url: MARKETING.siteUrl,
        email: MARKETING.contactEmail,
        logo: marketingAbsoluteUrl("/brand/logo-icon.png"),
        sameAs: Object.values(MARKETING.social),
      },
      {
        "@type": "WebSite",
        name: BRAND.appName,
        url: MARKETING.siteUrl,
        description: marketingText("seo.jsonLdDescription"),
        potentialAction: {
          "@type": "EntryPoint",
          urlTemplate: marketingAbsoluteUrl(MARKETING_ROUTES.requestAccess),
          name: marketingText("cta.requestAccess"),
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
