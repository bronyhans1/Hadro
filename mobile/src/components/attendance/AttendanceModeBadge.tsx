import { View, Text, StyleSheet } from "react-native";
import type { ThemePalette } from "@/store/theme";
import { isRemoteAttendanceSession } from "@/lib/sessionAttendance";
import { translate } from "@/lib/i18n";

type Props = {
  colors: ThemePalette;
  attendanceMode?: string | null;
  remoteApprovalStatus?: string | null;
  compact?: boolean;
};

function approvalTone(status: string | null | undefined): "pending" | "approved" | "rejected" | null {
  const s = (status ?? "").toLowerCase();
  if (s === "pending" || s === "approved" || s === "rejected") return s;
  return null;
}

function approvalLabel(tone: "pending" | "approved" | "rejected"): string {
  if (tone === "pending") return translate("leave.pending");
  if (tone === "approved") return translate("leave.approved");
  return translate("leave.rejected");
}

/** Lightweight REMOTE / ONSITE chip for session lists. */
export function AttendanceModeBadge({
  colors,
  attendanceMode,
  remoteApprovalStatus,
  compact,
}: Props) {
  const remote = isRemoteAttendanceSession({ attendance_mode: attendanceMode });
  const tone = remote ? approvalTone(remoteApprovalStatus) : null;
  const approval = tone ? approvalLabel(tone) : null;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.modePill,
          compact && styles.modePillCompact,
          {
            backgroundColor: remote ? colors.toneWarningBg : colors.toneNeutralBg,
          },
        ]}
      >
        <Text
          style={[
            styles.modeText,
            compact && styles.modeTextCompact,
            { color: remote ? colors.toneWarningText : colors.toneNeutralText },
          ]}
        >
          {remote ? translate("attendance.remote") : translate("attendance.onsite")}
        </Text>
      </View>
      {approval ? (
        <View
          style={[
            styles.modePill,
            compact && styles.modePillCompact,
            {
              backgroundColor:
                tone === "approved"
                  ? colors.toneSuccessBg
                  : tone === "rejected"
                    ? colors.surfaceDanger
                    : colors.toneWarningBg,
            },
          ]}
        >
          <Text
            style={[
              styles.modeText,
              compact && styles.modeTextCompact,
              {
                color:
                  tone === "approved"
                    ? colors.toneSuccessText
                    : tone === "rejected"
                      ? colors.danger
                      : colors.toneWarningText,
              },
            ]}
          >
            {approval}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modePillCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  modeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  modeTextCompact: { fontSize: 10 },
});
