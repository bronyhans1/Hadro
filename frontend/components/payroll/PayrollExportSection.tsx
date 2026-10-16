"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { translate } from "@/lib/i18n";

interface PayrollExportSectionProps {
  periodLabel: string;
  exportLoading: string | null;
  onExportCsv: () => void;
  onExportExcel: () => void;
}

export function PayrollExportSection({
  periodLabel,
  exportLoading,
  onExportCsv,
  onExportExcel,
}: PayrollExportSectionProps) {
  return (
    <div id="payroll-exports">
      <Card>
        <CardBody>
          <p className="mb-3 text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
            {translate("payroll.downloadForPeriod", { values: { period: periodLabel } })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={exportLoading !== null}
              onClick={onExportCsv}
            >
              {exportLoading === "csv" ? "…" : translate("payroll.downloadCsv")}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={exportLoading !== null}
              onClick={onExportExcel}
            >
              {exportLoading === "excel" ? "…" : translate("payroll.downloadExcel")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
