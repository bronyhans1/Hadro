import { View, Text, StyleSheet } from "react-native";
import type { ThemePalette } from "@/store/theme";
import { translate } from "@/lib/i18n";

type Props = {
  colors: ThemePalette;
  compact?: boolean;
};

export function OvernightBadge({ colors, compact }: Props) {
  return (
    <View
      style={[
        styles.badge,
        compact ? styles.badgeCompact : null,
        { backgroundColor: colors.toneWarningBg },
      ]}
    >
      <Text style={[styles.text, compact ? styles.textCompact : null, { color: colors.toneWarningText }]}>
        {translate("attendance.overnight")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  textCompact: {
    fontSize: 10,
  },
});
