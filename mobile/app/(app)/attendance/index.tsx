import { useCallback, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getMyEarningsSummary } from "@/lib/api/payroll.api";
import { getPolicy } from "@/lib/api/companyPolicy.api";
import { isApiError } from "@/types/api";
import { useThemePrefs } from "@/store/theme";
import { useAuth } from "@/store/auth";
import { isRemoteClockInVisible } from "@/lib/auth/remoteAttendanceVisibility";
import { pressStyle } from "@/lib/pressFeedback";
import { useActiveSession } from "@/hooks/useActiveSession";
import { invalidateAttendanceQueries } from "@/lib/attendanceQueries";
import { themedRefreshControlProps } from "@/lib/themedRefreshControl";
import { MobileEarningsSection } from "@/components/earnings/MobileEarningsSection";
import { formatSessionClock } from "@/lib/formatDateTime";
import { SessionAttendanceMeta } from "@/components/attendance/SessionAttendanceMeta";
import { AttendanceModeBadge } from "@/components/attendance/AttendanceModeBadge";
import { isOvernightSession, isRemoteAttendanceSession } from "@/lib/sessionAttendance";
import { checkoutRouteForSession } from "@/lib/attendanceCheckout";
import { useCurrentApprovedLeave } from "@/hooks/useCurrentApprovedLeave";
import { attendanceBlockedOnLeaveMessage } from "@/lib/leave/leaveLifecycle";
import { translate } from "@/lib/i18n";

export default function AttendanceHubScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useThemePrefs();
  const { user, refreshUser } = useAuth();
  const payrollEnabled = user != null && user.payrollEnabled !== false;
  const bizTz = user?.businessTimeZone ?? "Africa/Accra";

  const { activeSession, hasActiveSession, todayQuery } = useActiveSession({
    refetchOnFocus: true,
  });
  const { currentLeave, isOnApprovedLeave } = useCurrentApprovedLeave();

  const earningsQuery = useQuery({
    queryKey: ["payroll", "earnings", "me"],
    enabled: payrollEnabled,
    queryFn: async () => {
      const res = await getMyEarningsSummary();
      if (isApiError(res)) throw new Error(res.error);
      return res.data ?? null;
    },
  });

  const policyQuery = useQuery({
    queryKey: ["company-policy"],
    queryFn: async () => {
      const res = await getPolicy();
      if (isApiError(res)) throw new Error(res.error);
      return res.data;
    },
  });

  const refreshing =
    todayQuery.isRefetching ||
    (payrollEnabled && earningsQuery.isRefetching) ||
    policyQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await refreshUser();
    const tasks = [
      invalidateAttendanceQueries(queryClient),
      queryClient.invalidateQueries({ queryKey: ["company-policy"] }),
    ];
    if (payrollEnabled) {
      tasks.push(queryClient.invalidateQueries({ queryKey: ["payroll", "earnings", "me"] }));
    }
    await Promise.all(tasks);
  }, [queryClient, payrollEnabled, refreshUser]);

  useFocusEffect(
    useCallback(() => {
      void refreshUser();
    }, [refreshUser])
  );

  const loadingToday = todayQuery.isLoading && !todayQuery.data;
  const showRemoteClockIn =
    isRemoteClockInVisible(user, { hasActiveSession }) && !isOnApprovedLeave;
  const blockCheckIn = isOnApprovedLeave && !hasActiveSession;

  useEffect(() => {
    if (typeof __DEV__ === "undefined" || !__DEV__ || !user) return;
    console.log("[attendance] remote visibility", {
      "company.remote_attendance_enabled": user.companyRemoteAttendanceEnabled,
      remoteAttendanceAllowed: user.remoteAttendanceAllowed,
      effectiveRemoteAttendanceEnabled: user.effectiveRemoteAttendanceEnabled,
      hasActiveSession,
      showRemoteClockIn,
    });
  }, [user, hasActiveSession, showRemoteClockIn]);
  const isRemoteActive = hasActiveSession && isRemoteAttendanceSession(activeSession);
  const remotePending =
    isRemoteActive && (activeSession?.remote_approval_status as string | undefined) === "pending";

  function goToCheckout() {
    router.push(checkoutRouteForSession(activeSession));
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...themedRefreshControlProps(colors)}
        />
      }
    >
      <View>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{translate("navigation.attendance")}</Text>
        <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
          {isRemoteActive
            ? translate("attendance.remoteSessionHint")
            : translate("attendance.scanSiteHint")}
        </Text>
      </View>

      {blockCheckIn && currentLeave ? (
        <View style={[styles.leaveBanner, { backgroundColor: colors.surfaceWarning, borderColor: colors.warning }]}>
          <Text style={[styles.leaveBannerText, { color: colors.toneWarningText }]}>
            {attendanceBlockedOnLeaveMessage(currentLeave.end_date)}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.sectionLabel, { color: colors.muted }]}>{translate("attendance.todaysAttendance")}</Text>
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
        {loadingToday ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.muted, { color: colors.muted }]}>{translate("attendance.loadingStatus")}</Text>
          </View>
        ) : hasActiveSession && activeSession ? (
          <>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {isRemoteActive ? translate("attendance.clockedInRemote") : translate("attendance.clockedIn")}
              </Text>
            </View>
            <View style={styles.badgeRow}>
              <AttendanceModeBadge
                colors={colors}
                attendanceMode={activeSession.attendance_mode}
                remoteApprovalStatus={activeSession.remote_approval_status as string | null}
                compact
              />
            </View>
            {remotePending ? (
              <View style={[styles.remotePendingPill, { backgroundColor: colors.toneWarningBg }]}>
                <Text style={[styles.remotePendingText, { color: colors.toneWarningText }]}>
                  {translate("attendance.pendingApproval")}
                </Text>
              </View>
            ) : null}
            <Text style={[styles.statusDetail, { color: colors.muted }]}>
              {translate("attendance.since", { values: { time: formatSessionClock(activeSession.check_in ?? null, bizTz) } })}
            </Text>
            {isOvernightSession(activeSession) ? (
              <SessionAttendanceMeta colors={colors} session={activeSession} variant="stacked" />
            ) : null}
            <Text style={[styles.statusHint, { color: colors.muted }]}>
              {isRemoteActive
                ? translate("attendance.clockOutPayrollHint")
                : translate("attendance.clockOutScanHint")}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: colors.muted }]} />
              <Text style={[styles.statusTitle, { color: colors.text }]}>{translate("attendance.notClockedIn")}</Text>
            </View>
            <Text style={[styles.statusDetail, { color: colors.muted }]}>
              {translate("attendance.scanToStart")}
            </Text>
          </>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: colors.primary },
          blockCheckIn && styles.buttonDisabled,
          pressStyle({ pressed: !blockCheckIn && pressed }, { opacity: 0.9, scale: 0.98 }),
        ]}
        disabled={blockCheckIn}
        onPress={() => (hasActiveSession ? goToCheckout() : router.push("/attendance/scan"))}
      >
        <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
          {hasActiveSession ? translate("attendance.clockOut") : translate("attendance.scanToClockIn")}
        </Text>
      </Pressable>

      {showRemoteClockIn ? (
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.border, backgroundColor: colors.surface },
            pressStyle({ pressed }, { opacity: 0.92 }),
          ]}
          onPress={() => router.push("/attendance/remote-check-in")}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{translate("attendance.remoteClockIn")}</Text>
        </Pressable>
      ) : null}

      {payrollEnabled ? (
        <>
          <Text style={[styles.sectionLabel, styles.sectionSpacer, { color: colors.muted }]}>
            {translate("payroll.liveEarnings")}
          </Text>
          <MobileEarningsSection
            colors={colors}
            data={earningsQuery.data}
            isError={earningsQuery.isError}
            isLoading={earningsQuery.isLoading && earningsQuery.data === undefined}
            variant="full"
            currencyCode={policyQuery.data?.currency_code ?? "GHS"}
          />
        </>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.historyLink,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
          pressStyle({ pressed }, { opacity: 0.92 }),
        ]}
        onPress={() => router.push("/history")}
      >
        <Ionicons name="list-outline" size={20} color={colors.primary} />
        <View style={styles.historyLinkText}>
          <Text style={[styles.historyLinkTitle, { color: colors.text }]}>{translate("attendance.fullSessionHistory")}</Text>
          <Text style={[styles.historyLinkHint, { color: colors.muted }]}>
            {translate("attendance.fullSessionHistoryHint")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  leaveBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  leaveBannerText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  buttonDisabled: { opacity: 0.45 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  sectionSpacer: { marginTop: 24 },
  card: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  muted: { fontSize: 14 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  badgeRow: { marginTop: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusTitle: { fontSize: 18, fontWeight: "700" },
  statusDetail: { fontSize: 15, marginTop: 8 },
  statusHint: { fontSize: 13, marginTop: 6 },
  remotePendingPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  remotePendingText: { fontSize: 12, fontWeight: "700" },
  primaryButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "700" },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  historyLinkText: { flex: 1, minWidth: 0 },
  historyLinkTitle: { fontSize: 15, fontWeight: "700" },
  historyLinkHint: { fontSize: 12, marginTop: 4, lineHeight: 16 },
});
