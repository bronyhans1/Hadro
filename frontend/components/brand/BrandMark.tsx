"use client";

import Image from "next/image";
import { BRAND } from "@/lib/branding";
import { BRAND_ASSETS, BRAND_MARK_SIZES } from "@/lib/brandAssets";
import { cn } from "@/lib/design-system/cn";

type BrandMarkSize = keyof typeof BRAND_MARK_SIZES | number;

type BrandMarkProps = {
  size?: BrandMarkSize;
  className?: string;
  priority?: boolean;
  alt?: string;
  /**
   * Full approved PNG is always shown with object-fit: contain.
   * `compact` is accepted for compatibility and does not crop or scale.
   */
  fit?: "compact" | "contain";
};

function resolveSize(size: BrandMarkSize): number {
  return typeof size === "number" ? size : BRAND_MARK_SIZES[size];
}

/** Approved HADRO geometric symbol with automatic light/dark asset swap. */
export function BrandMark({
  size = "header",
  className,
  priority = false,
  alt = "",
}: BrandMarkProps) {
  const px = resolveSize(size);

  return (
    <span
      className={cn("brand-mark relative inline-flex shrink-0 overflow-visible", className)}
      style={{ width: px, height: px }}
    >
      <Image
        src={BRAND_ASSETS.symbolLight}
        alt={alt}
        width={px}
        height={px}
        priority={priority}
        className="brand-mark-light h-full w-full object-contain object-center dark:hidden"
      />
      <Image
        src={BRAND_ASSETS.symbolDark}
        alt={alt}
        width={px}
        height={px}
        priority={priority}
        className="brand-mark-dark hidden h-full w-full object-contain object-center dark:block"
      />
    </span>
  );
}

type BrandLockupProps = {
  size?: BrandMarkSize;
  layout?: "inline" | "stacked";
  showWordmark?: boolean;
  showDescriptor?: boolean;
  descriptor?: string;
  wordmarkClassName?: string;
  descriptorClassName?: string;
  className?: string;
  priority?: boolean;
  alt?: string;
};

export function BrandLockup({
  size = "header",
  layout = "inline",
  showWordmark = true,
  showDescriptor = false,
  descriptor = BRAND.compactDescriptor,
  wordmarkClassName,
  descriptorClassName,
  className,
  priority = false,
  alt = "",
}: BrandLockupProps) {
  const stacked = layout === "stacked";

  return (
    <span
      className={cn(
        "brand-lockup inline-flex min-w-0 overflow-visible",
        stacked ? "flex-col items-center text-center" : "flex-row items-center",
        className,
      )}
    >
      <BrandMark size={size} fit="contain" priority={priority} alt={alt} />
      {showWordmark ? (
        <span
          className={cn(
            "brand-lockup-copy flex min-w-0 flex-col",
            stacked ? "items-center" : "items-start justify-center",
            stacked ? "mt-2.5" : "ml-1",
          )}
        >
          <span
            className={cn(
              "brand-lockup-wordmark font-semibold tracking-[-0.03em] text-[var(--text-primary)]",
              stacked ? "text-[1.375rem] leading-none" : "text-[0.9375rem] leading-none",
              wordmarkClassName,
            )}
          >
            {BRAND.appName}
          </span>
          {showDescriptor ? (
            <span
              className={cn(
                "brand-lockup-descriptor mt-0.5 whitespace-nowrap text-[10px] font-normal leading-none tracking-[0.04em]",
                descriptorClassName ?? "text-[var(--text-muted)]",
              )}
            >
              {descriptor}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
