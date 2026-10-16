"use client";

import {
  applyReportDatePresetRange,
  type ReportDatePresetId,
} from "@/lib/utils/date";
import { FilterChip } from "./FilterChip";
import { translate } from "@/lib/i18n";

const PRESET_KEYS: { id: ReportDatePresetId; labelKey: "attendance.last7Days" | "attendance.thisMonth" | "reports.lastMonth" }[] = [
  { id: "last_7_days", labelKey: "attendance.last7Days" },
  { id: "this_month", labelKey: "attendance.thisMonth" },
  { id: "last_month", labelKey: "reports.lastMonth" },
];

export function ReportDatePresetButtons({
  onSelect,
  disabled,
  className = "",
  hideLabel = false,
  selected,
  start,
  end,
}: {
  onSelect: (start: string, end: string) => void;
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
  selected?: ReportDatePresetId;
  start?: string;
  end?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {!hideLabel ? <span className="text-xs font-medium text-theme-muted">{translate("reports.quickRanges")}</span> : null}
      {PRESET_KEYS.map(({ id, labelKey }) => {
        const range = applyReportDatePresetRange(id);
        const isSelected =
          selected === id || (selected === undefined && start === range.start && end === range.end);

        return (
          <FilterChip
            key={id}
            disabled={disabled}
            selected={isSelected}
            onClick={() => onSelect(range.start, range.end)}
          >
            {translate(labelKey)}
          </FilterChip>
        );
      })}
    </div>
  );
}
