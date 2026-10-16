import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { TRANSIENT_ALERT_MS } from "@/hooks/useAutoDismissAlert";
import { Ionicons } from "@expo/vector-icons";
import type { ThemePalette } from "@/store/theme";
import type { LeaveBalanceItem } from "@/lib/api/leaveBalances.api";
import {
  activeLeaveBalanceSummary,
  filterActiveLeaveBalances,
} from "@/lib/leave/leaveBalanceDisplay";
import { LeaveBalanceList } from "@/components/leave/LeaveBalanceCard";
import { pressStyle } from "@/lib/pressFeedback";
import { translate } from "@/lib/i18n";

type Props = {
  colors: ThemePalette;
  balances: LeaveBalanceItem[];
  loading?: boolean;
  /** True after balances loaded successfully at least once. */
  loaded?: boolean;
  error?: string | null;
  onViewAll: () => void;
};

export function ActiveLeaveBalancesSection({
  colors,
  balances,
  loading,
  loaded = false,
  error,
  onViewAll,
}: Props) {
  const activeBalances = filterActiveLeaveBalances(balances);
  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) {
      setDisplayError(null);
      return;
    }
    setDisplayError(error);
    const timer = setTimeout(() => setDisplayError(null), TRANSIENT_ALERT_MS);
    return () => clearTimeout(timer);
  }, [error]);

  const showEmptyState = loaded && activeBalances.length === 0;
  const showViewAll = loaded || balances.length > 0 || !error;

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>{translate("leave.leaveBalances")}</Text>
        <View style={[styles.inlineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>{translate("leave.loadingBalances")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>{translate("leave.leaveBalances")}</Text>

      {displayError ? (
        <View
          style={[
            styles.inlineCard,
            { backgroundColor: colors.surfaceDanger, borderColor: colors.danger },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.danger }]}>{displayError}</Text>
        </View>
      ) : null}

      {activeBalances.length > 0 ? (
        <>
          <Text style={[styles.summaryLine, { color: colors.muted }]}>
            {activeLeaveBalanceSummary(activeBalances.length)}
          </Text>
          <LeaveBalanceList colors={colors} balances={activeBalances} listMarginBottom={10} />
        </>
      ) : showEmptyState ? (
        <View
          style={[
            styles.emptyActive,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
          ]}
        >
          <Ionicons name="calendar-outline" size={22} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {translate("leave.noActiveBalances")}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>
            {balances.length > 0
              ? translate("leave.assignedTypesNoDays")
              : translate("leave.contactHrAllocation")}
          </Text>
        </View>
      ) : null}

      {showViewAll ? <ViewAllButton colors={colors} onPress={onViewAll} /> : null}
    </View>
  );
}

function ViewAllButton({ colors, onPress }: { colors: ThemePalette; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.viewAllBtn,
        { borderColor: colors.border, backgroundColor: colors.surface },
        pressStyle({ pressed }, { opacity: 0.92 }),
      ]}
    >
      <Text style={[styles.viewAllText, { color: colors.primary }]}>{translate("leave.viewAllBalances")}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  summaryLine: { fontSize: 13, marginBottom: 8 },
  inlineCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  loadingText: { fontSize: 14 },
  errorText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  emptyActive: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", marginTop: 4, textAlign: "center" },
  emptyBody: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  viewAllText: { fontSize: 15, fontWeight: "600" },
});
