import { View, Text, StyleSheet } from "react-native";
import type { ThemePalette } from "@/store/theme";
import {
  formatAttendanceDayShort,
  isOvernightSession,
  sessionAttendanceDayKey,
} from "@/lib/sessionAttendance";
import { OvernightBadge } from "./OvernightBadge";
import { translate } from "@/lib/i18n";

type SessionLike = {
  attendance_date?: string | null;
  check_in?: string | null;
  overnight_session?: boolean;
};

type Props = {
  colors: ThemePalette;
  session: SessionLike;
  /** Show ownership line on active/today cards. */
  variant?: "inline" | "stacked";
};

/**
 * Attendance ownership day + overnight indicator (V2 parity with web history).
 */
export function SessionAttendanceMeta({ colors, session, variant = "stacked" }: Props) {
  const dayKey = sessionAttendanceDayKey(session);
  const overnight = isOvernightSession(session);
  if (dayKey === "—" && !overnight) return null;

  const label = formatAttendanceDayShort(dayKey);

  if (variant === "inline") {
    return (
      <View style={styles.inlineRow}>
        <Text style={[styles.label, { color: colors.muted }]}>
          {translate("attendance.attendanceDay")}:{" "}
          <Text style={{ color: colors.text, fontWeight: "600" }}>{label}</Text>
        </Text>
        {overnight ? <OvernightBadge colors={colors} compact /> : null}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Text style={[styles.caption, { color: colors.muted }]}>{translate("attendance.attendanceDay")}</Text>
        {overnight ? <OvernightBadge colors={colors} compact /> : null}
      </View>
      <Text style={[styles.dayValue, { color: colors.text }]}>{label}</Text>
      {overnight ? (
        <Text style={[styles.hint, { color: colors.muted }]}>
          {translate("attendance.overnightPayrollHint")}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  label: { fontSize: 13, lineHeight: 18 },
  stack: { marginTop: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  caption: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayValue: { fontSize: 15, fontWeight: "700" },
  hint: { fontSize: 12, marginTop: 6, lineHeight: 17 },
});
