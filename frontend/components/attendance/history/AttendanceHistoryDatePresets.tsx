"use client";

import { useMemo } from "react";
import { FilterChip } from "@/components/ui/FilterChip";
import {
  applyHistoryDatePreset,
  detectActiveDatePreset,
  type HistoryDatePresetId,
} from "@/lib/attendance/attendanceHistoryUtils";
import { translate } from "@/lib/i18n";

const PRESETS: { id: HistoryDatePresetId; labelKey: string }[] = [
  { id: "today", labelKey: "attendance.today" },
  { id: "yesterday", labelKey: "attendance.yesterday" },
  { id: "last_7_days", labelKey: "attendance.last7Days" },
  { id: "last_30_days", labelKey: "attendance.last30Days" },
  { id: "this_month", labelKey: "attendance.thisMonth" },
  { id: "clear", labelKey: "attendance.clear" },
];

interface AttendanceHistoryDatePresetsProps {
  start: string;
  end: string;
  onApply: (start: string, end: string) => void;
}

export function AttendanceHistoryDatePresets({
  start,
  end,
  onApply,
}: AttendanceHistoryDatePresetsProps) {
  const activePreset = useMemo(() => detectActiveDatePreset(start, end), [start, end]);

  function handlePreset(preset: HistoryDatePresetId) {
    const range = applyHistoryDatePreset(preset);
    if (!range) {
      onApply("", "");
      return;
    }
    onApply(range.start, range.end);
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label={translate("attendance.quickDatePresets")}
    >
      {PRESETS.map((preset) => {
        const isActive = preset.id === "clear" ? !start && !end : activePreset === preset.id;
        return (
          <FilterChip
            key={preset.id}
            selected={isActive}
            className="shrink-0"
            onClick={() => handlePreset(preset.id)}
          >
            {translate(preset.labelKey)}
          </FilterChip>
        );
      })}
    </div>
  );
}
