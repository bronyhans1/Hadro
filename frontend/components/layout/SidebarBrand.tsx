"use client";

import Link from "next/link";
import { BRAND } from "@/lib/branding";
import { BrandMark } from "@/components/brand/BrandMark";
import { navText } from "@/lib/navigation/navText";

interface SidebarBrandProps {
  homeHref: string;
  subtitle?: string;
}

export function SidebarBrand({ homeHref, subtitle = BRAND.compactDescriptor }: SidebarBrandProps) {
  return (
    <div className="sidebar-brand">
      <Link href={homeHref} className="sidebar-brand-link" aria-label={navText("common.hadroHome", "HADRO home")}>
        <BrandMark size="sidebar" fit="contain" priority className="sidebar-brand-logo" />
        <div className="sidebar-brand-text min-w-0">
          <span className="sidebar-brand-title">HADRO</span>
          {subtitle ? <span className="sidebar-brand-subtitle">{subtitle}</span> : null}
        </div>
      </Link>
    </div>
  );
}
