"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/FormControls";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

interface DateRangeFilterProps {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApply: () => void;
  loading?: boolean;
  showApply?: boolean;
  className?: string;
  idPrefix?: string;
}

export function DateRangeFilter({
  start,
  end,
  onStartChange,
  onEndChange,
  onApply,
  loading = false,
  showApply = true,
  className = "",
  idPrefix = "date-range",
}: DateRangeFilterProps) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <div className="min-w-[10rem] flex-1 sm:flex-none">
        <DateInput
          id={`${idPrefix}-start`}
          label={translate("attendance.from")}
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
        />
      </div>
      <div className="min-w-[10rem] flex-1 sm:flex-none">
        <DateInput
          id={`${idPrefix}-end`}
          label={translate("attendance.to")}
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
        />
      </div>
      {showApply ? (
        <Button type="button" variant="primary" onClick={onApply} loading={loading}>
          {translate("attendance.apply")}
        </Button>
      ) : null}
    </div>
  );
}
