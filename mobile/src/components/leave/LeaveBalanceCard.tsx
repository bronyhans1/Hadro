import { View, Text, StyleSheet, Platform, ActivityIndicator } from "react-native";
import type { ThemePalette } from "@/store/theme";
import type { LeaveBalanceItem } from "@/lib/api/leaveBalances.api";
import { compensationLabel, leaveTypeLabel } from "@/lib/leaveTypes";
import { translate } from "@/lib/i18n";

type ListProps = {
  colors: ThemePalette;
  balances: LeaveBalanceItem[];
  listMarginBottom?: number;
};

export function LeaveBalanceList({ colors, balances, listMarginBottom = 16 }: ListProps) {
  return (
    <View style={[styles.list, listMarginBottom != null ? { marginBottom: listMarginBottom } : null]}>
      {balances.map((b) => (
        <LeaveBalanceRowCard key={b.id} colors={colors} balance={b} />
      ))}
    </View>
  );
}

export function LeaveBalanceRowCard({
  colors,
  balance: b,
}: {
  colors: ThemePalette;
  balance: LeaveBalanceItem;
}) {
  return (
    <View
      style={[
        styles.rowCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.rowHeader}>
        <Text style={[styles.typeLabel, { color: colors.text }]}>{leaveTypeLabel(b.leave_type, b.leave_type_label)}</Text>
        <View
          style={[
            styles.compBadge,
            {
              backgroundColor:
                b.leave_compensation_type === "unpaid"
                  ? colors.toneNeutralBg
                  : colors.toneSuccessBg,
            },
          ]}
        >
          <Text
            style={[
              styles.compBadgeText,
              {
                color:
                  b.leave_compensation_type === "unpaid"
                    ? colors.toneNeutralText
                    : colors.toneSuccessText,
              },
            ]}
          >
            {compensationLabel(b.leave_compensation_type)}
          </Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <StatBlock label={translate("leave.allocated")} value={String(b.allocated_days)} colors={colors} />
        <StatBlock label={translate("leave.used")} value={String(b.used_days)} colors={colors} />
        <StatBlock label={translate("leave.remaining")} value={String(b.remaining_days)} colors={colors} highlight />
      </View>
    </View>
  );
}

function StatBlock({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: ThemePalette;
  highlight?: boolean;
}) {
  return (
    <View style={styles.statBlock}>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
      <Text
        style={[styles.statValue, { color: highlight ? colors.primary : colors.text }]}
      >
        {value}
      </Text>
    </View>
  );
}

type SummaryProps = {
  colors: ThemePalette;
  balances: LeaveBalanceItem[];
  loading?: boolean;
  error?: string | null;
};

/** Renders every balance card (used in modal / legacy). */
export function LeaveBalanceSummary({ colors, balances, loading, error }: SummaryProps) {
  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>{translate("leave.loadingLeaveBalances")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surfaceDanger, borderColor: colors.danger },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      </View>
    );
  }

  if (balances.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          No leave balances are set up yet. Contact HR to assign your allocations.
        </Text>
      </View>
    );
  }

  return <LeaveBalanceList colors={colors} balances={balances} />;
}

/** @deprecated Use LeaveBalanceSummary — kept for import compatibility. */
export function LeaveBalanceCard(props: SummaryProps) {
  return <LeaveBalanceSummary {...props} />;
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  rowCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  typeLabel: { fontSize: 15, fontWeight: "700" },
  compBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  compBadgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statBlock: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  statValue: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    gap: 8,
  },
  loadingText: { fontSize: 14 },
  errorText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
});
