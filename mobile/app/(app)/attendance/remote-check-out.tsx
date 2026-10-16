import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { remoteClockOut } from "@/lib/api/attendance.api";
import { invalidateAttendanceQueries } from "@/lib/attendanceQueries";
import { useThemePrefs } from "@/store/theme";
import { useToast } from "@/components/toast";
import { pressStyle } from "@/lib/pressFeedback";
import { translate } from "@/lib/i18n";

export default function RemoteCheckOutScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useThemePrefs();
  const { show: showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemoteCheckOut() {
    setError(null);
    setLoading(true);
    try {
      const res = await remoteClockOut();
      if (res.success === false) {
        setError(res.error ?? translate("attendance.remoteClockOutFailed"));
        return;
      }
      await invalidateAttendanceQueries(queryClient);
      showToast({
        message: translate("attendance.remoteClockOutRecorded"),
        subtitle: translate("attendance.remoteClockOutPayrollSubtitle"),
        variant: "success",
      });
      router.replace("/attendance");
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("attendance.remoteClockOutFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{translate("attendance.remoteClockOut")}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {translate("attendance.remoteClockOutBody")}
      </Text>
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
        onPress={() => void handleRemoteCheckOut()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{translate("attendance.confirmRemoteClockOut")}</Text>
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
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 8 },
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
