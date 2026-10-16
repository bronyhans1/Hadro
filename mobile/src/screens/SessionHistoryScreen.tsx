import { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  getMySessionHistory,
  type SessionHistoryItem,
} from "@/lib/api/attendance.api";
import { useThemePrefs } from "@/store/theme";
import { formatCompactDuration, translate } from "@/lib/i18n";
import { sessionStatusBadge } from "@/lib/statusTokens";
import { useAuth } from "@/store/auth";
import { formatSessionClock } from "@/lib/formatDateTime";
import {
  formatAttendanceDayHeading,
  isOvernightSession,
  sessionAttendanceDayKey,
} from "@/lib/sessionAttendance";
import { AttendanceModeBadge } from "@/components/attendance/AttendanceModeBadge";
import { OvernightBadge } from "@/components/attendance/OvernightBadge";
import { themedRefreshControlProps } from "@/lib/themedRefreshControl";

function sessionStatusIcon(status: string): keyof typeof Ionicons.glyphMap {
  const s = (status ?? "").toUpperCase();
  if (s === "ACTIVE") return "pulse-outline";
  if (s === "COMPLETED") return "checkmark-circle-outline";
  if (s === "CANCELLED") return "close-circle-outline";
  return "ellipse-outline";
}

function formatDuration(m: number | null): string {
  if (m === null || m < 0) return "—";
  return formatCompactDuration(m);
}

/** List + fetch only — page title lives in `app/(app)/history/index.tsx`. */
export function SessionHistoryList() {
  const { colors } = useThemePrefs();
  const { user } = useAuth();
  const bizTz = user?.businessTimeZone ?? "Africa/Accra";
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["attendance", "history", "my"],
    queryFn: async () => {
      const res = await getMySessionHistory({ page: 1, limit: 50 });
      if (res.success === false) throw new Error(res.error);
      return res.data;
    },
  });

  const rows = data?.rows ?? [];

  const sections = useMemo(() => {
    const map = new Map<string, SessionHistoryItem[]>();
    for (const r of rows) {
      const key = sessionAttendanceDayKey(r);
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [rows]);

  const flatData = useMemo(() => {
    const out: Array<
      { type: "header"; dayKey: string } | { type: "row"; item: SessionHistoryItem }
    > = [];
    for (const [dayKey, items] of sections) {
      out.push({
        type: "header",
        dayKey,
      });
      for (const item of items) {
        out.push({ type: "row", item });
      }
    }
    return out;
  }, [sections]);

  if (isLoading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.muted, { color: colors.muted }]}>{translate("attendance.loadingSessions")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[styles.error, { color: colors.danger }]}>
          {translate("dashboard.failedLoad")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {rows.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{translate("attendance.noPastSessions")}</Text>
          <Text style={[styles.muted, { color: colors.muted }]}>
            {translate("attendance.sessionsWillAppear")}
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={flatData}
          keyExtractor={(entry, index) =>
            entry.type === "header" ? `h-${entry.dayKey}-${index}` : `r-${entry.item.id}`
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              {...themedRefreshControlProps(colors)}
            />
          }
          ListHeaderComponent={
            <Text style={[styles.listHint, { color: colors.muted }]}>
              {translate("attendance.historyGroupedSubtitle")}
            </Text>
          }
          renderItem={({ item: entry }) => {
            if (entry.type === "header") {
              const heading =
                entry.dayKey === "—"
                  ? translate("common.unknownDate")
                  : formatAttendanceDayHeading(entry.dayKey, bizTz);
              return (
                <View style={styles.sectionHeaderWrap}>
                  <Text style={[styles.sectionHeader, { color: colors.toneNeutralText }]}>
                    {heading}
                  </Text>
                  <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
                </View>
              );
            }
            const item = entry.item;
            const st = sessionStatusBadge(colors, item.status ?? "");
            const overnight = isOvernightSession(item);
            const branchLabel =
              [item.branch_name, item.department_name].filter(Boolean).join(" · ") || "—";
            return (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                <View style={styles.rowTop}>
                  <View style={styles.rowTopLeft}>
                    <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                      <Ionicons
                        name={sessionStatusIcon(item.status ?? "")}
                        size={14}
                        color={st.color}
                      />
                      <Text style={[styles.statusPillText, { color: st.color }]}>{st.label}</Text>
                    </View>
                    {overnight ? <OvernightBadge colors={colors} compact /> : null}
                    <AttendanceModeBadge
                      colors={colors}
                      attendanceMode={item.attendance_mode}
                      remoteApprovalStatus={item.remote_approval_status}
                      compact
                    />
                  </View>
                  <View
                    style={[
                      styles.branchPill,
                      { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name="business-outline" size={13} color={colors.muted} />
                    <Text style={[styles.branchText, { color: colors.text }]} numberOfLines={2}>
                      {branchLabel}
                    </Text>
                  </View>
                </View>
                <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
                <View style={styles.metaBlock}>
                  <Text style={[styles.metaLabel, { color: colors.muted }]}>{translate("attendance.attendanceDay")}</Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>
                    {sessionAttendanceDayKey(item)}
                  </Text>
                </View>
                <View style={styles.clockRow}>
                  <Text style={[styles.clockLabel, { color: colors.muted }]}>{translate("attendance.inLabel")}</Text>
                  <Text style={[styles.clockValue, { color: colors.text }]}>
                    {formatSessionClock(item.check_in, bizTz)}
                  </Text>
                </View>
                <View style={styles.clockRow}>
                  <Text style={[styles.clockLabel, { color: colors.muted }]}>{translate("attendance.outLabel")}</Text>
                  <Text style={[styles.clockValue, { color: colors.text }]}>
                    {formatSessionClock(item.check_out, bizTz)}
                  </Text>
                </View>
                {overnight ? (
                  <Text style={[styles.overnightHint, { color: colors.muted }]}>
                    {translate("attendance.overnightPayrollHint")}
                  </Text>
                ) : null}
                <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />
                <Text style={[styles.duration, { color: colors.muted }]}>
                  {translate("attendance.duration")} · {formatDuration(item.duration_minutes)}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1 },
  listContent: { paddingBottom: 32 },
  listHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  muted: { fontSize: 14 },
  error: { textAlign: "center", fontSize: 15, fontWeight: "600" },
  emptyBox: {
    marginTop: 4,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  sectionHeaderWrap: { marginTop: 20, marginBottom: 10 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  sectionDivider: { height: 1, marginTop: 8, opacity: 0.65 },
  row: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  rowTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 12, fontWeight: "800" },
  branchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "52%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  branchText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
  metaDivider: { height: 1, marginTop: 12, marginBottom: 10, opacity: 0.55 },
  metaBlock: { marginBottom: 8 },
  metaLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.35 },
  metaValue: { fontSize: 14, fontWeight: "700", marginTop: 3 },
  clockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 12,
  },
  clockLabel: { fontSize: 13, fontWeight: "600", width: 32 },
  clockValue: { fontSize: 15, fontWeight: "600", flex: 1, textAlign: "right" },
  overnightHint: { fontSize: 12, marginTop: 10, lineHeight: 17 },
  footerDivider: { height: 1, marginTop: 12, marginBottom: 8, opacity: 0.45 },
  duration: { fontSize: 13, fontWeight: "600" },
});
