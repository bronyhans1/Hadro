import { View, Text, StyleSheet } from "react-native";
import type { ThemePalette } from "@/store/theme";

type Variant = "error" | "warning" | "success";

type Props = {
  message: string | null;
  colors: ThemePalette;
  variant?: Variant;
  style?: object;
};

function variantStyles(variant: Variant, colors: ThemePalette) {
  switch (variant) {
    case "warning":
      return {
        backgroundColor: colors.surfaceWarning,
        borderColor: colors.warning,
        textColor: colors.warning,
      };
    case "success":
      return {
        backgroundColor: colors.toneSuccessBg,
        borderColor: colors.success,
        textColor: colors.toneSuccessText,
      };
    default:
      return {
        backgroundColor: colors.surfaceDanger,
        borderColor: colors.danger,
        textColor: colors.danger,
      };
  }
}

export function TransientAlert({ message, colors, variant = "error", style }: Props) {
  if (!message) return null;
  const tone = variantStyles(variant, colors);
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor },
        style,
      ]}
    >
      <Text style={[styles.text, { color: tone.textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
