import { View, Text, Pressable, StyleSheet } from "react-native";
import { LEAVE_TYPES, leaveTypeLabel } from "@/lib/leaveTypes";
import { translate } from "@/lib/i18n";
import type { ThemePalette } from "@/store/theme";
import { pressStyle } from "@/lib/pressFeedback";

type Props = {
  value: string;
  onChange: (value: string) => void;
  colors: ThemePalette;
};

export function LeaveTypeChips({ value, onChange, colors }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{translate("leave.leaveType")}</Text>
      <View style={styles.row}>
        {LEAVE_TYPES.map((t) => {
          const selected = value === t.value;
          return (
            <Pressable
              key={t.value}
              onPress={() => onChange(t.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary : colors.surface,
                },
                pressStyle({ pressed }, { opacity: 0.92 }),
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selected ? colors.onPrimary : colors.text },
                ]}
              >
                {leaveTypeLabel(t.value)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: "30%",
    flexGrow: 1,
    alignItems: "center",
  },
  chipText: { fontSize: 13, fontWeight: "600" },
});
