import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { MARKETING } from "@/lib/marketing/siteConfig";
import { marketingText } from "@/lib/marketing/text";
import { cn } from "@/lib/design-system/cn";

type Props = {
  className?: string;
  /** Horizontal row (default) or stacked column. */
  layout?: "row" | "stack";
};

/**
 * Production App Store / Google Play badges from MARKETING_IMAGES.
 * Rendered ~56–64px tall with preserved aspect ratio.
 */
export function StoreBadges({ className, layout = "row" }: Props) {
  return (
    <div
      className={cn(
        "flex items-center",
        layout === "stack" ? "flex-col items-start gap-3" : "flex-row flex-wrap gap-4 sm:gap-5",
        className
      )}
    >
      <a
        href={MARKETING.appStoreUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={marketingText("stores.appStore")}
        className="inline-block origin-center rounded-lg transition-[transform,filter,box-shadow] duration-[var(--mkt-duration)] ease-[var(--mkt-ease)] hover:scale-[1.05] hover:brightness-110 hover:drop-shadow-[0_8px_20px_rgba(15,23,42,0.18)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MARKETING_IMAGES.badgeAppStore}
          alt={marketingText("stores.appStore")}
          className="h-14 w-auto max-w-full object-contain object-left sm:h-16"
          loading="lazy"
          decoding="async"
        />
      </a>
      <a
        href={MARKETING.playStoreUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={marketingText("stores.playStore")}
        className="inline-block origin-center rounded-lg transition-[transform,filter,box-shadow] duration-[var(--mkt-duration)] ease-[var(--mkt-ease)] hover:scale-[1.05] hover:brightness-110 hover:drop-shadow-[0_8px_20px_rgba(15,23,42,0.18)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MARKETING_IMAGES.badgeGooglePlay}
          alt={marketingText("stores.playStore")}
          className="h-14 w-auto max-w-full object-contain object-left sm:h-16"
          loading="lazy"
          decoding="async"
        />
      </a>
    </div>
  );
}
