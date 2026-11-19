"use client";

import { Select } from "@/components/ui/FormControls";
import { translate } from "@/lib/i18n";

interface PayrollPeriodSelectorProps {
  year: number;
  month: number;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
  disabled?: boolean;
}

export function PayrollPeriodSelector({
  year,
  month,
  onYearChange,
  onMonthChange,
  disabled,
}: PayrollPeriodSelectorProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0 w-full sm:w-auto">
        <label htmlFor="payroll-period-year" className="mb-1 block text-xs font-medium" style={{ color: "var(--ds-color-text-muted)" }}>
          {translate("payroll.year")}
        </label>
        <input
          id="payroll-period-year"
          type="number"
          min={2000}
          max={2100}
          value={year}
          disabled={disabled}
          onChange={(e) => onYearChange(Number(e.target.value) || year)}
          className="input-field w-full py-1.5 sm:w-24"
        />
      </div>
      <div className="min-w-0 w-full sm:min-w-[6rem] sm:w-auto">
        <Select
          id="payroll-period-month"
          label={translate("leave.month")}
          value={String(month)}
          disabled={disabled}
          className="w-full"
          onChange={(e) => onMonthChange(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
