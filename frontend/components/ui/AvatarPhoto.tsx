"use client";

import Image from "next/image";

interface AvatarPhotoProps {
  src: string;
  alt?: string;
  /** Pixel size for width/height (prevents layout shift). */
  size: number;
  className?: string;
}

/**
 * Profile/avatar photos from remote storage.
 * Uses next/image for sizing + lazy loading; unoptimized avoids remote-host config
 * regressions for arbitrary/signed photo URLs.
 */
export function AvatarPhoto({ src, alt = "", size, className = "" }: AvatarPhotoProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      sizes={`${size}px`}
      unoptimized
    />
  );
}
