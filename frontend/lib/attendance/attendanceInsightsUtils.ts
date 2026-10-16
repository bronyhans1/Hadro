import type {
  AbsenceSummary,
  AbsenceSummaryEmployee,
  FlagsSummary,
  FlagsSummaryEmployee,
  LatenessSummary,
  LatenessSummaryEmployee,
} from "@/lib/api/attendance.api";
import { translate } from "@/lib/i18n";

export interface InsightStatItem {
  title: string;
  value: string | number;
  subtitle?: string;
}

export interface InsightHighlightItem {
  id: string;
  label: string;
  value: string;
  attention?: boolean;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function buildLatenessStats(data: LatenessSummary): InsightStatItem[] {
  const avgLate = average(data.employees.map((e) => e.average_late_minutes));
  const highestLate = data.employees.reduce<LatenessSummaryEmployee | null>((best, row) => {
    if (!best || row.total_late_minutes > best.total_late_minutes) return row;
    return best;
  }, null);

  return [
    {
      title: translate("attendance.lateEmployees"),
      value: data.employees.length,
      subtitle: translate("attendance.inSelectedPeriod"),
    },
    {
      title: translate("attendance.lateIncidents"),
      value: data.summary.totalLateIncidents,
      subtitle: translate("attendance.totalLateSessions"),
    },
    {
      title: translate("attendance.repeatedLate"),
      value: data.summary.repeatedLateEmployees,
      subtitle: translate("attendance.employeesFlagged"),
    },
    {
      title: translate("attendance.averageLateness"),
      value: avgLate !== null ? translate("attendance.minutesValue", { values: { count: String(avgLate) } }) : "—",
      subtitle: translate("attendance.perEmployeeAverage"),
    },
    {
      title: translate("attendance.highestLateness"),
      value: highestLate
        ? translate("attendance.minutesValue", { values: { count: String(highestLate.total_late_minutes) } })
        : "—",
      subtitle: highestLate?.name ?? translate("attendance.noRecords"),
    },
  ];
}

export function buildLatenessInsights(data: LatenessSummary): InsightHighlightItem[] {
  const mostFrequent = data.employees.reduce<LatenessSummaryEmployee | null>((best, row) => {
    if (!best || row.late_count > best.late_count) return row;
    return best;
  }, null);

  const highestMinutes = data.employees.reduce<LatenessSummaryEmployee | null>((best, row) => {
    if (!best || row.total_late_minutes > best.total_late_minutes) return row;
    return best;
  }, null);

  const items: InsightHighlightItem[] = [
    {
      id: "period",
      label: translate("attendance.reportingPeriod"),
      value: `${data.period.start} → ${data.period.end}`,
    },
  ];

  if (mostFrequent) {
    items.push({
      id: "most-frequent",
      label: translate("attendance.mostFrequentLate"),
      value: `${mostFrequent.name} · ${translate("attendance.incidentCount", { count: mostFrequent.late_count })}`,
      attention: mostFrequent.repeated_late,
    });
  }

  if (highestMinutes && highestMinutes.user_id !== mostFrequent?.user_id) {
    items.push({
      id: "highest-minutes",
      label: translate("attendance.highestTotalLateMinutes"),
      value: `${highestMinutes.name} · ${translate("attendance.minutesValue", { values: { count: String(highestMinutes.total_late_minutes) } })}`,
      attention: highestMinutes.repeated_late,
    });
  }

  return items;
}

export function buildFlagsStats(data: FlagsSummary): InsightStatItem[] {
  const needsAttention = data.employees.filter((e) => e.attention_needed).length;
  const critical = data.employees.filter((e) => e.attendance_flag_level === "high").length;
  const medium = data.employees.filter((e) => e.attendance_flag_level === "medium").length;

  return [
    {
      title: translate("attendance.employeesFlaggedTitle"),
      value: data.summary.employeesFlagged,
      subtitle: translate("attendance.inSelectedPeriod"),
    },
    {
      title: translate("attendance.highRisk"),
      value: data.summary.highRiskEmployees,
      subtitle: translate("attendance.criticalAttention"),
    },
    {
      title: translate("attendance.needsReview"),
      value: needsAttention,
      subtitle: translate("attendance.attentionRequired"),
    },
    {
      title: translate("attendance.criticalFlags"),
      value: critical,
      subtitle: translate("attendance.highSeverity"),
    },
    {
      title: translate("attendance.mediumFlags"),
      value: medium,
      subtitle: translate("attendance.moderateSeverity"),
    },
  ];
}

export function buildFlagsInsights(data: FlagsSummary): InsightHighlightItem[] {
  const highestRisk = data.employees
    .filter((e) => e.attendance_flag_level === "high")
    .sort((a, b) => b.late_count + b.early_leave_count - (a.late_count + a.early_leave_count))[0];

  const needsAttention = data.employees.find((e) => e.attention_needed);

  const items: InsightHighlightItem[] = [
    {
      id: "period",
      label: translate("attendance.reportingPeriod"),
      value: `${data.period.start} → ${data.period.end}`,
    },
  ];

  if (highestRisk) {
    items.push({
      id: "highest-risk",
      label: translate("attendance.highestRiskEmployee"),
      value: `${highestRisk.name} · ${
        highestRisk.attendance_flag_level === "high"
          ? translate("attendance.highRiskPhrase")
          : highestRisk.attendance_flag_level === "medium"
            ? translate("attendance.mediumRiskPhrase")
            : `${highestRisk.attendance_flag_level} risk`
      }`,
      attention: true,
    });
  } else if (needsAttention) {
    items.push({
      id: "needs-attention",
      label: translate("attendance.employeeNeedingReview"),
      value: translate("attendance.namedAttentionRequired", { values: { name: needsAttention.name } }),
      attention: true,
    });
  }

  const repeatedLate = data.employees.filter((e) => e.repeated_late).length;
  if (repeatedLate > 0) {
    items.push({
      id: "repeated-late",
      label: translate("attendance.repeatedLatenessLabel"),
      value: translate("attendance.repeatedLatePatterns", { count: repeatedLate }),
      attention: true,
    });
  }

  return items;
}

export function buildAbsenceStats(data: AbsenceSummary): InsightStatItem[] {
  const repeated = data.employees.filter((e) => e.repeated_absence).length;
  const highest = data.employees.reduce<AbsenceSummaryEmployee | null>((best, row) => {
    if (!best || row.absence_count > best.absence_count) return row;
    return best;
  }, null);

  return [
    {
      title: translate("attendance.totalIncidents"),
      value: data.summary.totalAbsenceIncidents,
      subtitle: translate("attendance.inSelectedPeriod"),
    },
    {
      title: translate("navigation.employees"),
      value: data.summary.employeesWithAbsences,
      subtitle: translate("attendance.withAbsences"),
    },
    {
      title: translate("attendance.repeatedAbsence"),
      value: repeated,
      subtitle: translate("attendance.employeesFlagged"),
    },
    {
      title: translate("attendance.highestCount"),
      value: highest?.absence_count ?? "—",
      subtitle: highest?.name ?? translate("attendance.noRecords"),
    },
  ];
}

export function buildAbsenceInsights(data: AbsenceSummary): InsightHighlightItem[] {
  const mostAbsences = data.employees.reduce<AbsenceSummaryEmployee | null>((best, row) => {
    if (!best || row.absence_count > best.absence_count) return row;
    return best;
  }, null);

  const items: InsightHighlightItem[] = [
    {
      id: "period",
      label: translate("attendance.reportingPeriod"),
      value: `${data.period.start} → ${data.period.end}`,
    },
  ];

  if (mostAbsences) {
    items.push({
      id: "most-absences",
      label: translate("attendance.mostAbsences"),
      value: `${mostAbsences.name} · ${translate("attendance.absenceDays", { count: mostAbsences.absence_count })}`,
      attention: mostAbsences.repeated_absence,
    });
  }

  const repeated = data.employees.filter((e) => e.repeated_absence);
  if (repeated.length > 0) {
    items.push({
      id: "repeated",
      label: translate("attendance.repeatedAbsencePatterns"),
      value: translate("attendance.repeatedAbsenceEmployees", { count: repeated.length }),
      attention: true,
    });
  }

  return items;
}

export function flagLevelVariant(level: string): "danger" | "warning" | "default" {
  if (level === "high") return "danger";
  if (level === "medium") return "warning";
  return "default";
}
