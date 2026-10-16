"use client";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/FormControls";
import { Label } from "@/components/ui/Label";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMonthLabel } from "@/lib/utils/date";
import { translate } from "@/lib/i18n";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface LeaveCalendarPageHeaderProps {
  year: number;
  month: number;
  onToday: () => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onMonthChange: (year: number, month: number) => void;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleDateString(undefined, { month: "long" }),
}));

export function LeaveCalendarPageHeader({
  year,
  month,
  onToday,
  onPreviousMonth,
  onNextMonth,
  onMonthChange,
}: LeaveCalendarPageHeaderProps) {
  const yearOptions = Array.from({ length: 7 }, (_, i) => year - 3 + i);

  return (
    <PageHeader
      title={translate("navigation.leaveCalendar")}
      subtitle={translate("leave.calendarSubtitle")}
      actions={
        <div
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end"
          role="group"
          aria-label={translate("leave.calendarNavigation")}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToday}
            leftIcon={<CalendarDays className="h-4 w-4" aria-hidden />}
          >
            {translate("leave.today")}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPreviousMonth}
              aria-label={translate("leave.previousMonth")}
              leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden />}
            >
              {translate("leave.previousMonth")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onNextMonth}
              aria-label={translate("leave.nextMonth")}
              rightIcon={<ChevronRight className="h-4 w-4" aria-hidden />}
            >
              {translate("leave.nextMonth")}
            </Button>
          </div>
          <div className="flex gap-2">
            <div>
              <Label htmlFor="leave-cal-month" className="sr-only">
                {translate("leave.month")}
              </Label>
              <Select
                id="leave-cal-month"
                value={String(month)}
                onChange={(e) => onMonthChange(year, Number(e.target.value))}
                className="min-w-[8rem]"
                aria-label={translate("leave.monthNamed", { values: { month: formatMonthLabel(year, month) } })}
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="leave-cal-year" className="sr-only">
                {translate("leave.year")}
              </Label>
              <Select
                id="leave-cal-year"
                value={String(year)}
                onChange={(e) => onMonthChange(Number(e.target.value), month)}
                className="min-w-[5.5rem]"
                aria-label={translate("leave.yearNamed", { values: { year } })}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      }
    />
  );
}
