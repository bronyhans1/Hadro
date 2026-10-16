import { View, Text, StyleSheet } from "react-native";
import type { ThemePalette } from "@/store/theme";
import type { EarningsSummary } from "@/lib/api/payroll.api";
import { formatCurrency, type CurrencyCode } from "@/lib/formatCurrency";
import { translate } from "@/lib/i18n";
import {
  earningsHistoryTypeLabel,
  isPaidLeaveHistoryRow,
  isSalaryDailyPayrollRecord,
} from "@/lib/payroll/payrollSemantics";
import { toLiveEarnedLeaveView } from "@/lib/payroll/liveLeaveEarningsView";

type Props = {
  colors: ThemePalette;
  data: EarningsSummary | null | undefined;
  isError: boolean;
  isLoading: boolean;
  variant: "full" | "compact";
  currencyCode: CurrencyCode | "GHS" | "USD";
};

/**
 * Shared live earnings UI: full detail on Attendance, compact snapshot on Home.
 * Paid leave credits from the workforce engine appear as soon as they are written.
 */
export function MobileEarningsSection({ colors, data, isError, isLoading, variant, currencyCode }: Props) {
  const live = data != null ? toLiveEarnedLeaveView(data) : data;
  if (variant === "compact") {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text style={[styles.compactEyebrow, { color: colors.muted }]}>{translate("payroll.earningsCompanyCalendar")}</Text>
        {isError ? (
          <Text style={[styles.muted, { color: colors.danger }]}>{translate("payroll.couldNotLoadEarnings")}</Text>
        ) : isLoading && live == null ? (
          <Text style={[styles.muted, { color: colors.muted }]}>{translate("common.loadingEllipsis")}</Text>
        ) : live == null || live.rate_type === "none" ? (
          <Text style={[styles.compactMuted, { color: colors.muted }]}>
            {translate("payroll.noCompensationCompact")}
          </Text>
        ) : (
          <>
            {live.earnings_period_label ? (
              <Text style={[styles.compactHint, { color: colors.muted, marginBottom: 6 }]}>
                {live.earnings_period_label}
              </Text>
            ) : null}
            <View style={styles.compactRow}>
              <Text style={[styles.compactMain, { color: colors.text }]}>
                <Text style={[styles.compactLabel, { color: colors.muted }]}>
                  {translate("payroll.dayLabel", { values: { date: live.calendar_today ?? "—" } })}{" "}
                </Text>
                {formatCurrency(live.today_earned, currencyCode)}
              </Text>
              <Text style={[styles.compactDot, { color: colors.muted }]}> · </Text>
              <Text style={[styles.compactMain, { color: colors.text }]}>
                <Text style={[styles.compactLabel, { color: colors.muted }]}>{translate("payroll.thisMonthLabel")}</Text>
                {formatCurrency(live.month_earned_total, currencyCode)}
              </Text>
            </View>
            {(live.month_late_deduction_total ?? 0) > 0 ? (
              <Text style={[styles.compactLateNote, { color: colors.muted }]}>
                {translate("payroll.lateMtd", {
                  values: { amount: formatCurrency(live.month_late_deduction_total ?? 0, currencyCode) },
                })}
              </Text>
            ) : null}
          </>
        )}
        <Text style={[styles.compactHint, { color: colors.muted }]}>
          {translate("payroll.fullBreakdownHint")}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {isError ? (
        <Text style={[styles.muted, { color: colors.danger }]}>{translate("payroll.couldNotLoadEarnings")}</Text>
      ) : live == null ? (
        <Text style={[styles.muted, { color: colors.muted }]}>{translate("common.loadingEllipsis")}</Text>
      ) : live.rate_type === "none" ? (
        <Text style={[styles.muted, { color: colors.muted }]}>
          {translate("payroll.noCompensationFull")}
        </Text>
      ) : (
        <>
          {live.earnings_period_label ? (
            <Text style={[styles.mutedSmall, { color: colors.muted, marginTop: 0 }]}>
              {live.earnings_period_label}
            </Text>
          ) : null}
          <View style={styles.earningsGrid}>
            <View style={[styles.earningsStat, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.earningsStatLbl, { color: colors.muted }]}>
                {translate("payroll.todayWithDate", { values: { date: live.calendar_today ?? "—" } })}
              </Text>
              <Text style={[styles.earningsStatVal, { color: colors.text }]}>
                {formatCurrency(live.today_earned, currencyCode)}
              </Text>
            </View>
            <View style={[styles.earningsStat, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.earningsStatLbl, { color: colors.muted }]}>{translate("payroll.thisMonth")}</Text>
              <Text style={[styles.earningsStatVal, { color: colors.text }]}>
                {formatCurrency(live.month_earned_total, currencyCode)}
              </Text>
            </View>
          </View>
          {live.rate_type === "monthly" ? (
            <>
              <View style={styles.earningsGrid}>
                <View style={[styles.earningsStat, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                  <Text style={[styles.earningsStatLbl, { color: colors.muted }]}>{translate("payroll.expectedSalary")}</Text>
                  <Text style={[styles.earningsStatVal, { color: colors.text }]}>
                    {live.expected_monthly_salary != null
                      ? formatCurrency(live.expected_monthly_salary, currencyCode)
                      : "—"}
                  </Text>
                </View>
                <View style={[styles.earningsStat, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                  <Text style={[styles.earningsStatLbl, { color: colors.muted }]}>{translate("payroll.paidUnpaidDays")}</Text>
                  <Text style={[styles.earningsStatVal, { color: colors.text }]}>
                    {live.paid_days} / {live.unpaid_days}
                  </Text>
                </View>
              </View>
              {live.daily_rate != null ? (
                <Text style={[styles.mutedSmall, { color: colors.muted, marginTop: 10 }]}>
                  {translate("payroll.dailyRatePayable", {
                    values: {
                      amount: formatCurrency(live.daily_rate, currencyCode),
                      days: live.payable_days_in_month,
                    },
                  })}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={[styles.mutedSmall, { color: colors.muted, marginTop: 10 }]}>{translate("payroll.hourlyTotals")}</Text>
          )}
          {(live.month_late_deduction_total ?? 0) > 0 || (live.today_late_deduction ?? 0) > 0 ? (
            <View style={[styles.lateBreakCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.lateBreakTitle, { color: colors.text }]}>{translate("payroll.latePayDeduction")}</Text>
              <Text style={[styles.mutedSmall, { color: colors.muted, marginTop: 4 }]}>
                {translate("payroll.latePayHint")}
              </Text>
              <View style={styles.lateBreakGrid}>
                <View>
                  <Text style={[styles.lateBreakLbl, { color: colors.muted }]}>{translate("payroll.todayBaseShort")}</Text>
                  <Text style={[styles.lateBreakVal, { color: colors.text }]}>
                    {formatCurrency(live.today_base_before_late ?? live.today_earned, currencyCode)}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.lateBreakLbl, { color: colors.muted }]}>{translate("payroll.todayLateShort")}</Text>
                  <Text style={[styles.lateBreakVal, { color: colors.text }]}>
                    {(live.today_late_deduction ?? 0) > 0
                      ? `−${formatCurrency(live.today_late_deduction ?? 0, currencyCode)}`
                      : "—"}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.lateBreakLbl, { color: colors.muted }]}>{translate("payroll.monthLateShort")}</Text>
                  <Text style={[styles.lateBreakVal, { color: colors.text }]}>
                    {(live.month_late_deduction_total ?? 0) > 0
                      ? `−${formatCurrency(live.month_late_deduction_total ?? 0, currencyCode)}`
                      : "—"}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
          {live.daily_history && live.daily_history.length > 0 ? (
            <View style={[styles.historyCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.lateBreakTitle, { color: colors.text }]}>{translate("payroll.recentDayCredits")}</Text>
              <Text style={[styles.mutedSmall, { color: colors.muted, marginTop: 4 }]}>
                {live.rate_type === "monthly"
                  ? translate("payroll.monthlyDayCreditsHint")
                  : translate("payroll.sessionEarningsHint")}
              </Text>
              {live.daily_history.slice(0, 7).map((row) => {
                const paidLeave = isPaidLeaveHistoryRow(row);
                const salary = isSalaryDailyPayrollRecord(row.record_type) && !paidLeave;
                return (
                  <View key={`${row.date}-${row.record_type}`} style={styles.historyRow}>
                    <View style={styles.historyRowLeft}>
                      <Text style={[styles.historyDate, { color: colors.text }]}>{row.date}</Text>
                      <View
                        style={[
                          styles.typePill,
                          {
                            backgroundColor: paidLeave
                              ? colors.toneSuccessBg
                              : salary
                                ? colors.toneNeutralBg
                                : colors.toneSuccessBg,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "800",
                            color: paidLeave
                              ? colors.toneSuccessText
                              : salary
                                ? colors.toneNeutralText
                                : colors.toneSuccessText,
                          }}
                        >
                          {earningsHistoryTypeLabel(row.record_type, {
                            earning_source: row.earning_source,
                            payroll_day_classification: row.payroll_day_classification,
                          })}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.historyGross, { color: colors.text }]}>
                      {formatCurrency(row.gross, currencyCode)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  muted: { fontSize: 14 },
  mutedSmall: { fontSize: 13, marginTop: 10 },
  compactEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  compactRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 4 },
  compactMain: { fontSize: 16, fontWeight: "700" },
  compactLabel: { fontSize: 14, fontWeight: "600" },
  compactDot: { fontSize: 16, fontWeight: "600" },
  compactMuted: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  compactHint: { fontSize: 12, marginTop: 10, lineHeight: 18 },
  earningsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  earningsStat: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  earningsStatLbl: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  earningsStatVal: { fontSize: 18, fontWeight: "800", marginTop: 6 },
  compactLateNote: { fontSize: 12, marginTop: 8, lineHeight: 18 },
  lateBreakCard: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  lateBreakTitle: { fontSize: 13, fontWeight: "700" },
  lateBreakGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 12,
  },
  lateBreakLbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  lateBreakVal: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  historyCard: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  historyRowLeft: { flex: 1, gap: 4 },
  historyDate: { fontSize: 14, fontWeight: "700" },
  typePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  historyGross: { fontSize: 15, fontWeight: "800" },
});
