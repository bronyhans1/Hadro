import { useLayoutEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { clockOut } from "@/lib/api/attendance.api";
import { invalidateAttendanceQueries } from "@/lib/attendanceQueries";
import { useThemePrefs } from "@/store/theme";
import { useAuth } from "@/store/auth";
import { pressStyle } from "@/lib/pressFeedback";
import { useToast } from "@/components/toast";
import { translate } from "@/lib/i18n";
import { formatBusinessTimeOnly } from "@/lib/formatDateTime";
import { useActiveSession } from "@/hooks/useActiveSession";
import { isRemoteAttendanceSession } from "@/lib/sessionAttendance";

export default function CheckOutScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useThemePrefs();
  const { show: showToast } = useToast();
  const { user } = useAuth();
  const { activeSession, isLoading } = useActiveSession({ refetchOnFocus: true });
  const bizTz = user?.businessTimeZone ?? "Africa/Accra";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const isRemote = isRemoteAttendanceSession(activeSession);

  useLayoutEffect(() => {
    if (isRemote) {
      router.replace("/attendance/remote-check-out");
    }
  }, [isRemote, router]);

  async function handleCheckOut() {
    setError(null);
    setLocationError(null);
    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const res = await clockOut({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (res.success === false) {
        setError(res.error ?? translate("attendance.clockOutFailed"));
        return;
      }
      await invalidateAttendanceQueries(queryClient);
      const payrollNote =
        res.warnings && res.warnings.length > 0
          ? res.warnings.map((w) => w.message).join(" ")
          : undefined;
      const timeNote = translate("attendance.recordedAt", {
        values: { time: formatBusinessTimeOnly(new Date(), bizTz) },
      });
      showToast({
        message: translate("attendance.clockedOutSuccessfully"),
        subtitle: payrollNote ? `${timeNote} · ${payrollNote}` : timeNote,
        variant: "success",
        durationMs: payrollNote ? 4500 : 3500,
      });
      setTimeout(() => {
        router.replace("/attendance");
      }, 600);
    } catch (e) {
      if (e instanceof Error && e.message.includes("location")) {
        setLocationError(translate("attendance.locationPermissionClockOut"));
      } else {
        setError(e instanceof Error ? e.message : translate("attendance.clockOutFailed"));
      }
    } finally {
      setLoading(false);
    }
  }

  if (isLoading || isRemote) {
    return (
      <View style={[styles.container, styles.resolving, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{translate("attendance.clockOut")}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {translate("attendance.locationVerifiedBeforeClockOut")}
      </Text>
      {error || locationError ? (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.surfaceDanger, borderColor: colors.danger },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error ?? locationError}
          </Text>
        </View>
      ) : null}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary },
          loading && styles.buttonDisabled,
          pressStyle({ pressed: pressed || loading }, { opacity: 0.88, scale: 0.99 }),
        ]}
        onPress={handleCheckOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{translate("attendance.confirmClockOut")}</Text>
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
  resolving: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 14, marginTop: 8, lineHeight: 20 },
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
