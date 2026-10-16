"use client";

import Link from "next/link";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

export function ReportsBackLink() {
  return (
    <Link
      href="/reports"
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium transition-colors",
        "text-[var(--ds-color-primary)] hover:underline underline-offset-4 focus-visible:outline-none ds-focus-ring rounded-md"
      )}
    >
      {translate("reports.backTo")}
    </Link>
  );
}
