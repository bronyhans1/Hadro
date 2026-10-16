"use client";

import { ResponsiveFilterCard } from "@/components/ui/FilterCard";
import { DateInput } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";
import { translate } from "@/lib/i18n";

interface AttendanceInsightFiltersProps {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApply: () => void;
  loading?: boolean;
}

function FilterFields({
  start,
  end,
  onStartChange,
  onEndChange,
  onApply,
  loading,
}: AttendanceInsightFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[160px] flex-1 sm:max-w-[200px]">
        <DateInput
          id="insight-date-start"
          label={translate("attendance.from")}
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
        />
      </div>
      <div className="min-w-[160px] flex-1 sm:max-w-[200px]">
        <DateInput
          id="insight-date-end"
          label={translate("attendance.to")}
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
        />
      </div>
      <Button type="button" variant="primary" onClick={onApply} loading={loading} className="w-full sm:w-auto">
        {translate("attendance.apply")}
      </Button>
    </div>
  );
}

export function AttendanceInsightFilters(props: AttendanceInsightFiltersProps) {
  return (
    <ResponsiveFilterCard
      mobileId="insight-filters-mobile"
      description={translate("attendance.selectDateRange")}
    >
      <FilterFields {...props} />
    </ResponsiveFilterCard>
  );
}
