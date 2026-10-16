"use client";

import { ResponsiveFilterCard } from "@/components/ui/FilterCard";
import { MonthInput } from "@/components/ui/FormControls";
import { translate } from "@/lib/i18n";

interface PayrollRecordsFiltersProps {
  year: number;
  month: number;
  onPeriodChange: (year: number, month: number) => void;
  disabled?: boolean;
}

function FilterFields({ year, month, onPeriodChange, disabled }: PayrollRecordsFiltersProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <MonthInput
          id="payroll-records-period"
          label={translate("payroll.payrollPeriod")}
          value={`${year}-${String(month).padStart(2, "0")}`}
          disabled={disabled}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-");
            if (y && m) onPeriodChange(Number(y), Number(m));
          }}
        />
      </div>
    </div>
  );
}

export function PayrollRecordsFilters(props: PayrollRecordsFiltersProps) {
  return (
    <ResponsiveFilterCard mobileId="payroll-records-filters-mobile">
      <FilterFields {...props} />
    </ResponsiveFilterCard>
  );
}
