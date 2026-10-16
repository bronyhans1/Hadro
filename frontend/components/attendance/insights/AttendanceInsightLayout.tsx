"use client";

import React from "react";
import { AttendanceSection } from "@/components/attendance/AttendanceSection";
import { translate } from "@/lib/i18n";

interface AttendanceInsightLayoutProps {
  summary: React.ReactNode;
  insight: React.ReactNode;
  results: React.ReactNode;
  summaryTitle?: string;
  resultsTitle?: string;
}

export function AttendanceInsightLayout({
  summary,
  insight,
  results,
  summaryTitle = translate("attendance.summary"),
  resultsTitle = translate("attendance.results"),
}: AttendanceInsightLayoutProps) {
  return (
    <div className="space-y-8">
      <AttendanceSection title={summaryTitle} description={translate("attendance.keyMetrics")}>
        {summary}
      </AttendanceSection>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="order-2 lg:order-1 lg:col-span-2">
          <AttendanceSection title={resultsTitle} description={translate("attendance.detailedBreakdown")}>
            {results}
          </AttendanceSection>
        </div>
        <div className="order-1 lg:order-2">
          {insight}
        </div>
      </div>
    </div>
  );
}
