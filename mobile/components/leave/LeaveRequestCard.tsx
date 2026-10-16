import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { LeaveRequestItem } from "@/lib/api/leave.api";
import { leaveStatusBadge } from "@/lib/statusTokens";
import { leaveTypeIcon, leaveTypeAccent } from "@/lib/leavePresentation";
import { leaveTypeLabel } from "@/lib/leaveTypes";
import { translate } from "@/lib/i18n";
import { formatDisplayDate } from "@/lib/dates";
import type { ThemePalette } from "@/store/theme";
import { pressStyle } from "@/lib/pressFeedback";

type Props = {
  item: LeaveRequestItem;
  colors: ThemePalette;
  onCancel?: (leaveId: string) => void;
  cancelDisabled?: boolean;
};

export function LeaveRequestCard({ item, colors, onCancel, cancelDisabled }: Props) {
  const badge = leaveStatusBadge(colors, item.status);
  const accent = leaveTypeAccent(item.leave_type, colors);
  const icon = leaveTypeIcon(item.leave_type);
  const isPending = (item.status ?? "").trim().toLowerCase() === "pending";
  const statusNorm = (item.status ?? "").trim().toLowerCase();
  const isTerminated = statusNorm === "terminated";
  const isCompleted = statusNorm === "completed";
  const restored = Number(item.restored_days ?? 0);

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
      <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
        <Ionicons name={icon} size={22} color={accent.fg} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.dates, { color: colors.text }]}>
            {formatDisplayDate(item.start_date)} → {formatDisplayDate(item.end_date)}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>
        <Text style={[styles.meta, { color: colors.muted }]}>
          {leaveTypeLabel(item.leave_type)} · {translate("leave.days", { count: item.total_days })}
        </Text>
        {isTerminated ? (
          <Text style={[styles.meta2, { color: colors.muted }]}>
            {translate("leave.returned", { values: { date: item.actual_return_date ?? "—" } })}
            {restored > 0 ? ` · ${translate("leave.restoredDays", { count: restored })}` : ""}
          </Text>
        ) : null}
        {isCompleted ? (
          <Text style={[styles.meta2, { color: colors.muted }]}>
            {translate("leave.periodFullyConsumed")}
          </Text>
        ) : null}
        {item.reason ? (
          <Text style={[styles.reason, { color: colors.text }]} numberOfLines={2}>
            {item.reason}
          </Text>
        ) : null}

        {isPending && onCancel ? (
          <Pressable
            onPress={() => onCancel(item.id)}
            disabled={cancelDisabled}
            style={({ pressed }) => [
              styles.cancelBtn,
              { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
              cancelDisabled ? styles.cancelBtnDisabled : null,
              pressStyle({ pressed: pressed || !!cancelDisabled }, { opacity: 0.92 }),
            ]}
          >
            <Text style={[styles.cancelText, { color: colors.muted }]}>
              {cancelDisabled ? translate("leave.cancelling") : translate("leave.cancelRequest")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  dates: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "800" },
  meta: { fontSize: 13, marginTop: 6, fontWeight: "500" },
  meta2: { fontSize: 12, marginTop: 4, fontWeight: "500" },
  reason: { fontSize: 14, marginTop: 8, lineHeight: 20, opacity: 0.9 },
  cancelBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnDisabled: { opacity: 0.7 },
  cancelText: { fontSize: 13, fontWeight: "700" },
});
