import type { ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";
import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { marketingText } from "@/lib/marketing/text";
import { MarketingMedia } from "./MarketingMedia";

export type DashboardScreen = {
  id: string;
  label: string;
  src?: string;
  alt?: string;
};

export type DashboardHotspot = {
  id: string;
  /** Percentage position within the stage (0–100). */
  x: number;
  y: number;
  label: string;
  description?: string;
  /** When true, renders in an emphasized state for future animation hooks. */
  active?: boolean;
};

export type DashboardLayer = {
  id: string;
  content: ReactNode;
  className?: string;
};

type Props = {
  title?: string;
  className?: string;
  /** Primary screenshot — defaults to dashboard overview asset. */
  src?: string;
  /** Multiple dashboard screens for future carousels / tabbed showcases. */
  screens?: DashboardScreen[];
  /** Active screen id when using `screens` (defaults to first). */
  activeScreenId?: string;
  /** Absolute-positioned callouts / hotspots over the visual stage. */
  hotspots?: DashboardHotspot[];
  /** Layered marketing UI cards rendered above the stage. */
  layers?: DashboardLayer[];
  /** Optional interactive or animated overlays. */
  children?: ReactNode;
  /** Browser chrome caption. */
  chromeLabel?: string;
  /** Stage aspect ratio. */
  aspect?: "wide" | "video";
  /** Extra class for the visual stage region. */
  stageClassName?: string;
};

/**
 * Extensible dashboard showcase shell.
 * Defaults to MARKETING_IMAGES.dashboardOverview — overwrite that .webp to update.
 */
export function DashboardMockup({
  title = marketingText("mockup.dashboardTitle"),
  className,
  src = MARKETING_IMAGES.dashboardOverview,
  screens,
  activeScreenId,
  hotspots,
  layers,
  children,
  chromeLabel = marketingText("mockup.chrome"),
  aspect = "wide",
  stageClassName,
}: Props) {
  const resolvedScreens =
    screens && screens.length > 0
      ? screens
      : [{ id: "primary", label: title, src }];

  const active =
    resolvedScreens.find((s) => s.id === activeScreenId) ?? resolvedScreens[0];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--mkt-radius-2xl)] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] shadow-[var(--mkt-shadow-lift)]",
        className
      )}
      data-mkt-dashboard-mockup=""
      data-active-screen={active?.id}
    >
      <div
        className="flex items-center gap-2 border-b border-[var(--mkt-border)] px-4 py-3"
        style={{ background: "var(--mkt-mist)" }}
      >
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
        </span>
        <span className="ml-2 truncate text-xs font-medium text-[var(--mkt-gray)]">{chromeLabel}</span>
        {resolvedScreens.length > 1 ? (
          <div className="ml-auto hidden items-center gap-1 sm:flex" aria-label={marketingText("mockup.screens")}>
            {resolvedScreens.map((screen) => (
              <span
                key={screen.id}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  screen.id === active?.id
                    ? "bg-[var(--mkt-sky)] text-[var(--mkt-royal)]"
                    : "text-[var(--mkt-gray)]"
                )}
              >
                {screen.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className={cn("relative", stageClassName)} data-mkt-dashboard-stage="">
        <MarketingMedia
          label={active?.label ?? title}
          src={active?.src ?? MARKETING_IMAGES.dashboardOverview}
          aspect={aspect}
          className="rounded-none border-0 shadow-none"
        />

        {hotspots && hotspots.length > 0 ? (
          <ul className="pointer-events-none absolute inset-0 list-none p-0" aria-label={marketingText("mockup.highlights")}>
            {hotspots.map((spot) => (
              <li
                key={spot.id}
                className="absolute"
                style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: "translate(-50%, -50%)" }}
                data-active={spot.active ? "true" : "false"}
              >
                <span
                  className={cn(
                    "flex h-3 w-3 items-center justify-center rounded-full border-2 border-white shadow-md",
                    spot.active ? "bg-[var(--mkt-royal)]" : "bg-[var(--mkt-navy)]"
                  )}
                  title={spot.label}
                  aria-hidden
                />
                <span className="sr-only">
                  {spot.label}
                  {spot.description ? `: ${spot.description}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {layers?.map((layer) => (
          <div
            key={layer.id}
            className={cn("pointer-events-none absolute z-[1]", layer.className)}
            data-mkt-dashboard-layer={layer.id}
          >
            {layer.content}
          </div>
        ))}

        {children ? (
          <div className="absolute inset-0 z-[2]" data-mkt-dashboard-overlay="">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type PhoneProps = {
  title?: string;
  className?: string;
  src?: string;
  children?: ReactNode;
};

/** Mobile product frame — defaults to MARKETING_IMAGES.mobileHome. */
export function PhoneMockup({
  title = marketingText("mockup.mobileTitle"),
  className,
  src = MARKETING_IMAGES.mobileHome,
  children,
}: PhoneProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[2rem] border-[6px] border-[var(--mkt-navy)] bg-[var(--mkt-navy)] shadow-[var(--mkt-shadow-lift)]",
        className
      )}
      data-mkt-phone-mockup=""
    >
      <div className="overflow-hidden rounded-[1.55rem] bg-[var(--mkt-surface)]">
        <div className="flex justify-center py-2" aria-hidden>
          <span className="h-1.5 w-16 rounded-full bg-[var(--mkt-border-strong)]" />
        </div>
        <div className="relative">
          <MarketingMedia
            label={title}
            src={src}
            aspect="phone"
            className="max-w-none rounded-none border-0 shadow-none"
          />
          {children ? (
            <div className="absolute inset-0 z-[1]" data-mkt-phone-overlay="">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
