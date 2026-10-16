"use client";

import { MARKETING_IMAGES } from "@/lib/marketing/assets";

type AtmospherePictureProps = {
  webp: string;
  fallback: string;
  variant: "light" | "dark";
};

function AtmospherePicture({ webp, fallback, variant }: AtmospherePictureProps) {
  return (
    <picture className={`mkt-art-variant mkt-art-variant--${variant}`}>
      <source srcSet={webp} type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fallback}
        alt=""
        className="mkt-art-image"
        decoding="async"
        fetchPriority="low"
      />
    </picture>
  );
}

/**
 * Main-content atmosphere plane (footer stays clear).
 * Light/dark variants swap instantly with `html.dark` via CSS — no refresh needed.
 */
export function MarketingAtmosphere() {
  return (
    <div className="mkt-art-plane" aria-hidden>
      <AtmospherePicture
        variant="light"
        webp={MARKETING_IMAGES.atmosphereLight}
        fallback={MARKETING_IMAGES.atmosphereLightFallback}
      />
      <AtmospherePicture
        variant="dark"
        webp={MARKETING_IMAGES.atmosphereDark}
        fallback={MARKETING_IMAGES.atmosphereDarkFallback}
      />
    </div>
  );
}
