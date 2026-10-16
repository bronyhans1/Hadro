import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { MARKETING } from "@/lib/marketing/siteConfig";
import { isPublishedStoreUrl } from "@/lib/marketing/storeLinks";
import { marketingText } from "@/lib/marketing/text";
import { cn } from "@/lib/design-system/cn";

type Props = {
  className?: string;
  /** Horizontal row (default) or stacked column. */
  layout?: "row" | "stack";
};

type BadgeProps = {
  href: string;
  label: string;
  src: string;
};

function StoreBadge({ href, label, src }: BadgeProps) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      className="h-14 w-auto max-w-full object-contain object-left sm:h-16"
      loading="lazy"
      decoding="async"
    />
  );

  if (!isPublishedStoreUrl(href)) {
    return (
      <span aria-label={label} className="inline-block rounded-lg">
        {image}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-block origin-center rounded-lg transition-[transform,filter,box-shadow] duration-[var(--mkt-duration)] ease-[var(--mkt-ease)] hover:scale-[1.05] hover:brightness-110 hover:drop-shadow-[0_8px_20px_rgba(15,23,42,0.18)]"
    >
      {image}
    </a>
  );
}

/**
 * Production App Store / Google Play badges from MARKETING_IMAGES.
 * Rendered ~56–64px tall with preserved aspect ratio.
 * Badges stay visible but non-clickable until live store URLs are configured.
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
      <StoreBadge
        href={MARKETING.appStoreUrl}
        label={marketingText("stores.appStore")}
        src={MARKETING_IMAGES.badgeAppStore}
      />
      <StoreBadge
        href={MARKETING.playStoreUrl}
        label={marketingText("stores.playStore")}
        src={MARKETING_IMAGES.badgeGooglePlay}
      />
    </div>
  );
}
