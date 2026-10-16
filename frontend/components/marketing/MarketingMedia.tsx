import { cn } from "@/lib/design-system/cn";

type Props = {
  label: string;
  /** Public path from MARKETING_IMAGES — required for production asset wiring. */
  src: string;
  aspect?: "video" | "square" | "wide" | "phone" | "panorama" | "photo";
  /** Defaults to cover. Use contain for full illustrations (e.g. workflow). */
  fit?: "cover" | "contain";
  /** Premium product-showcase frame (workflow, hero product art). */
  variant?: "default" | "showcase";
  className?: string;
  /** Optional classes for the `<img>` (e.g. object-position crop). */
  imgClassName?: string;
  /** Overlay / caption content rendered above the image inside the frame. */
  children?: React.ReactNode;
};

const aspectClass = {
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[16/10]",
  /** Matches workflow artwork native ~2:1 — avoids CSS side letterboxing with contain. */
  panorama: "aspect-[2/1]",
  /** Soft product photo / illustration frame (e.g. business problems). */
  photo: "aspect-[4/3]",
  phone: "aspect-[9/19] max-w-[280px] mx-auto",
} as const;

/**
 * Marketing media frame.
 * Always loads a file from the centralized /public/marketing asset system.
 * Replace the asset on disk to update visuals — no code changes required.
 */
export function MarketingMedia({
  label,
  src,
  aspect = "wide",
  fit = "cover",
  variant = "default",
  className,
  imgClassName,
  children,
}: Props) {
  const isContain = fit === "contain";
  const isShowcase = variant === "showcase";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isShowcase
          ? "mkt-media-showcase"
          : cn(
              "rounded-[var(--mkt-radius-xl)] border border-[var(--mkt-border)]",
              isContain ? "bg-[var(--mkt-surface)]" : "bg-[var(--mkt-mist)]"
            ),
        aspectClass[aspect],
        className
      )}
      style={isShowcase ? undefined : { boxShadow: "var(--mkt-shadow-glow)" }}
    >
      {isShowcase ? <div className="mkt-media-showcase__glow" aria-hidden /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className={cn(
          "absolute inset-0 z-[1] h-full w-full",
          isContain ? "object-contain object-center" : "object-cover",
          imgClassName
        )}
        loading="lazy"
        decoding="async"
      />
      {children}
    </div>
  );
}
