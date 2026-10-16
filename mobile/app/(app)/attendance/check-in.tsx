import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { clockIn } from "@/lib/api/attendance.api";
import { invalidateAttendanceQueries } from "@/lib/attendanceQueries";
import { useThemePrefs } from "@/store/theme";
import { useAuth } from "@/store/auth";
import { pressStyle } from "@/lib/pressFeedback";
import { useToast } from "@/components/toast";
import { useCurrentApprovedLeave } from "@/hooks/useCurrentApprovedLeave";
import { attendanceBlockedOnLeaveMessage } from "@/lib/leave/leaveLifecycle";
import { formatBusinessTimeOnly } from "@/lib/formatDateTime";
import { translate } from "@/lib/i18n";

export default function CheckInScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useThemePrefs();
  const { show: showToast } = useToast();
  const { user } = useAuth();
  const bizTz = user?.businessTimeZone ?? "Africa/Accra";
  const params = useLocalSearchParams<{
    branchId?: string;
    branchName?: string;
  }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentLeave, isOnApprovedLeave } = useCurrentApprovedLeave();

  if (isOnApprovedLeave && currentLeave) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{translate("attendance.unableToClockIn")}</Text>
        <Text style={[styles.office, { color: colors.muted }]}>
          {attendanceBlockedOnLeaveMessage(currentLeave.end_date)}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.back, pressStyle({ pressed })]}
          onPress={() => router.replace("/attendance")}
        >
          <Text style={[styles.backText, { color: colors.primary }]}>{translate("attendance.backToAttendance")}</Text>
        </Pressable>
      </View>
    );
  }

  async function handleCheckIn() {
    setError(null);
    const branchId = params.branchId?.trim();
    if (!branchId) {
      setError(translate("attendance.missingOffice"));
      return;
    }
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError(translate("attendance.locationPermissionClockIn"));
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const res = await clockIn({
        branch_id: branchId,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (res.success === false) {
        setError(res.error ?? translate("attendance.clockInFailed"));
        return;
      }
      await invalidateAttendanceQueries(queryClient);
      showToast({
        message: translate("attendance.clockedInSuccessfully"),
        subtitle: translate("attendance.recordedAt", {
          values: { time: formatBusinessTimeOnly(new Date(), bizTz) },
        }),
        variant: "success",
      });
      setTimeout(() => {
        router.replace("/attendance");
      }, 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("attendance.clockInFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{translate("attendance.clockIn")}</Text>
      {params.branchName ? (
        <Text style={[styles.office, { color: colors.muted }]}>{params.branchName}</Text>
      ) : null}
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.surfaceDanger, borderColor: colors.danger }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary },
          loading && styles.buttonDisabled,
          pressStyle({ pressed: pressed || loading }, { opacity: 0.88, scale: 0.99 }),
        ]}
        onPress={handleCheckIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{translate("attendance.confirmClockIn")}</Text>
        )}
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.back, pressStyle({ pressed })]}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={[styles.backText, { color: colors.muted }]}>{translate("common.back")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: "800" },
  office: { fontSize: 16, marginTop: 8 },
  errorBox: {
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
  },
  errorText: { fontWeight: "600", fontSize: 14 },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 32,
    minHeight: 54,
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { fontSize: 16, fontWeight: "700" },
  back: { alignItems: "center", marginTop: 16, paddingVertical: 8 },
  backText: { fontWeight: "600", fontSize: 16 },
});
