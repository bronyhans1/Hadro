"use client";

import type { LeaveCalendarDay } from "@/lib/leave/leaveCalendarUtils";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/design-system/cn";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";

interface LeaveCalendarAgendaViewProps {
  days: LeaveCalendarDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  monthLabel: string;
}

function formatAgendaDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function LeaveCalendarAgendaView({
  days,
  selectedDate,
  onSelectDate,
  monthLabel,
}: LeaveCalendarAgendaViewProps) {
  if (days.length === 0) {
    return (
      <EmptyState
        title={translate("leave.noLeaveThisMonth")}
        description={translate("leave.noApprovedInMonth", { values: { month: monthLabel } })}
      />
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label={translate("leave.monthLeaveAgenda", { values: { month: monthLabel } })}>
      {days.map((day) => {
        const expanded = selectedDate === day.date;
        return (
          <div
            key={day.date}
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--ds-color-border)" }}
          >
            <button
              type="button"
              onClick={() => onSelectDate(day.date)}
              aria-expanded={expanded}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
                "hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]",
                expanded && "bg-[var(--ds-color-primary-muted)]"
              )}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                {formatAgendaDate(day.date)}
                {day.isToday ? (
                  <span className="ml-2 text-xs font-normal" style={{ color: "var(--ds-color-primary)" }}>
                    {translate("leave.today")}
                  </span>
                ) : null}
              </span>
              <span className="text-xs tabular-nums" style={{ color: "var(--ds-color-text-muted)" }}>
                {translate("leave.countOnLeave", { values: { count: day.events.length } })}
              </span>
            </button>

            {expanded ? (
              <ul
                className="space-y-2 border-t px-4 py-3"
                style={{ borderColor: "var(--ds-color-border)" }}
                role="list"
              >
                {day.events.length === 0 ? (
                  <li className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
                    {translate("leave.noLeaveOnThisDay")}
                  </li>
                ) : (
                  day.events.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm"
                      style={{ background: event.color.bg }}
                    >
                      <span className="truncate font-medium" style={{ color: event.color.text }}>
                        {event.employeeName}
                      </span>
                      <Badge variant="default">{leaveTypeLabel(event.leaveType)}</Badge>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
