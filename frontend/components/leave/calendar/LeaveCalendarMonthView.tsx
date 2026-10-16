"use client";

import { useCallback, useRef } from "react";
import type { LeaveCalendarDay } from "@/lib/leave/leaveCalendarUtils";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/design-system/cn";

import { translate } from "@/lib/i18n";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface LeaveCalendarMonthViewProps {
  days: LeaveCalendarDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  monthLabel: string;
}

function dayNumber(date: string): string {
  return String(Number(date.slice(8, 10)));
}

export function LeaveCalendarMonthView({
  days,
  selectedDate,
  onSelectDate,
  monthLabel,
}: LeaveCalendarMonthViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const cols = 7;
      let next = index;
      switch (e.key) {
        case "ArrowLeft":
          next = index - 1;
          break;
        case "ArrowRight":
          next = index + 1;
          break;
        case "ArrowUp":
          next = index - cols;
          break;
        case "ArrowDown":
          next = index + cols;
          break;
        case "Home":
          next = index - (index % cols);
          break;
        case "End":
          next = index - (index % cols) + (cols - 1);
          break;
        default:
          return;
      }
      e.preventDefault();
      const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>("[data-cal-day]");
      const target = buttons?.[next];
      target?.focus();
      if (target?.dataset.date) onSelectDate(target.dataset.date);
    },
    [onSelectDate]
  );

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ds-color-border)" }}>
      <div
        className="border-b px-4 py-3 text-sm font-semibold"
        style={{
          borderColor: "var(--ds-color-border)",
          color: "var(--ds-color-text-primary)",
          background: "var(--ds-color-surface-muted)",
        }}
      >
        {monthLabel}
      </div>

      <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--ds-color-border)" }}>
        {WEEKDAY_KEYS.map((key) => (
          <div
            key={key}
            className="px-1 py-2 text-center text-xs font-medium"
            style={{ color: "var(--ds-color-text-muted)" }}
            aria-hidden
          >
            {translate(`leave.weekdays.${key}`)}
          </div>
        ))}
      </div>

      <div ref={gridRef} className="grid grid-cols-7" role="grid" aria-label={translate("leave.monthLeaveCalendar", { values: { month: monthLabel } })}>
        {days.map((day, index) => {
          const isSelected = selectedDate === day.date;
          const eventCount = day.events.length;
          const ariaLabel = `${day.date}${day.isToday ? translate("leave.todaySuffix") : ""}${
            eventCount > 0
              ? translate("leave.approvedLeaveEvents", { count: eventCount })
              : translate("leave.noLeaveSuffix")
          }`;

          return (
            <button
              key={day.date}
              type="button"
              data-cal-day
              data-date={day.date}
              role="gridcell"
              aria-label={ariaLabel}
              aria-selected={isSelected}
              tabIndex={isSelected || (!selectedDate && day.isToday) ? 0 : -1}
              onClick={() => onSelectDate(day.date)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "min-h-[5.5rem] border-b border-r p-1.5 text-left transition-colors last:border-r-0",
                "hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring-focus)]",
                !day.inMonth && "opacity-40",
                isSelected && "bg-[var(--ds-color-primary-muted)]"
              )}
              style={{ borderColor: "var(--ds-color-border)" }}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                  day.isToday && "font-semibold"
                )}
                style={
                  day.isToday
                    ? {
                        background: "var(--ds-color-primary)",
                        color: "#fff",
                      }
                    : { color: "var(--ds-color-text-primary)" }
                }
              >
                {dayNumber(day.date)}
              </span>

              <div className="mt-1 space-y-0.5" aria-hidden={eventCount === 0}>
                {day.events.slice(0, 2).map((event) => (
                  <Tooltip
                    key={event.id}
                    content={`${event.employeeName} · ${event.leaveTypeLabel}`}
                  >
                    <span
                      className="ds-caption block truncate rounded px-1 py-0.5 font-medium leading-tight"
                      style={{
                        background: event.color.bg,
                        color: event.color.text,
                        borderLeft: `2px solid ${event.color.border}`,
                      }}
                    >
                      {event.employeeName}
                    </span>
                  </Tooltip>
                ))}
                {eventCount > 2 ? (
                  <span className="ds-caption block px-1">
                    {translate("leave.moreCount", { values: { count: eventCount - 2 } })}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
