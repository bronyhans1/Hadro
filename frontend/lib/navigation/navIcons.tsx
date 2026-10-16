import React from "react";
import { cn } from "@/lib/design-system/cn";

type IconProps = { className?: string };

function Icon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      className={className ?? "h-[18px] w-[18px] shrink-0"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  dashboard: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </Icon>
  ),
  employees: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </Icon>
  ),
  attendance: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
  ),
  leave: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </Icon>
  ),
  payroll: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
  ),
  organization: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </Icon>
  ),
  reports: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </Icon>
  ),
  audit: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </Icon>
  ),
  settings: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </Icon>
  ),
  companies: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
    </Icon>
  ),
  provision: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </Icon>
  ),
  default: (p: IconProps) => (
    <Icon {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
  ),
};

const HREF_ICON_MAP: Record<string, keyof typeof icons> = {
  "/dashboard": "dashboard",
  "/employees": "employees",
  "/attendance": "attendance",
  "/attendance/history": "attendance",
  "/attendance/remote-review": "attendance",
  "/attendance/lateness": "attendance",
  "/attendance/flags": "attendance",
  "/attendance/absence": "attendance",
  "/leave": "leave",
  "/leave/requests": "leave",
  "/leave/calendar": "leave",
  "/leave/balance": "leave",
  "/payroll": "payroll",
  "/payroll/manual-overtime": "payroll",
  "/payroll/records": "payroll",
  "/branches": "organization",
  "/departments": "organization",
  "/shifts": "organization",
  "/reports": "reports",
  "/audit": "audit",
  "/company-profile": "organization",
  "/settings": "settings",
  "/platform/dashboard": "dashboard",
  "/platform/companies": "companies",
  "/platform/companies/new": "provision",
  "/platform/audit": "audit",
  "/platform/settings": "settings",
};

export function NavIcon({ href, className }: { href: string; className?: string }) {
  const key = HREF_ICON_MAP[href] ?? "default";
  const Component = icons[key];
  return <Component className={cn("sidebar-nav-icon", className)} />;
}
