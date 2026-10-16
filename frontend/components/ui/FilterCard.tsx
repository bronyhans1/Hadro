"use client";

import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardBody, CardHeader } from "./Card";
import { cn } from "@/lib/design-system/cn";
import { Button } from "./Button";
import { translate } from "@/lib/i18n";

interface FilterCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Shared responsive surface for search, date, and status filters. */
export function FilterCard({
  children,
  title = translate("reports.filters"),
  description,
  actions,
  className,
  bodyClassName,
}: FilterCardProps) {
  return (
    <Card padding={false} className={className}>
      <CardHeader
        className="flex-wrap"
      >
        <div className="min-w-0">
          <h2 className="ds-h3 flex items-center gap-2 text-sm">
            <SlidersHorizontal
              className="h-4 w-4 text-[var(--ds-color-primary)]"
              aria-hidden
            />
            {title}
          </h2>
          {description ? (
            <p className="ds-caption mt-1">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </CardHeader>
      <CardBody className={cn("space-y-4", bodyClassName)}>{children}</CardBody>
    </Card>
  );
}

export function FilterGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export function ResponsiveFilterCard({
  children,
  description,
  mobileId,
  title = translate("reports.filters"),
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  mobileId: string;
  title?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <FilterCard title={title}>
      {description ? (
        <div className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
          {description}
        </div>
      ) : null}
      <div className="md:hidden">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls={mobileId}
        >
          {mobileOpen ? translate("common.hideFilters") : translate("common.showFilters")}
        </Button>
      </div>
      <div
        id={mobileId}
        className={cn("md:block", mobileOpen ? "mt-3 block md:mt-0" : "hidden")}
      >
        {children}
      </div>
    </FilterCard>
  );
}
