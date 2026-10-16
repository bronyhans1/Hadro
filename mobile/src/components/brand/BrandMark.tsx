import { Image, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { BRAND } from "@/lib/branding";
import { useThemePrefs } from "@/store/theme";

const SYMBOL_LIGHT = require("../../../assets/brand/logo-icon.png");
const SYMBOL_DARK = require("../../../assets/brand/logo-icon-dark.png");

type BrandMarkProps = {
  size: number;
  style?: StyleProp<ViewStyle>;
  fit?: "compact" | "contain";
};

/** Approved HADRO geometric symbol with automatic light/dark asset swap. */
export function BrandMark({ size, style, fit = "compact" }: BrandMarkProps) {
  const { mode } = useThemePrefs();
  const contain = fit === "contain";
  return (
    <View style={[{ width: size, height: size, overflow: contain ? "visible" : "hidden" }, style]}>
      <Image
        source={mode === "dark" ? SYMBOL_DARK : SYMBOL_LIGHT}
        style={[{ width: size, height: size }, contain ? null : { transform: [{ scale: 1.2 }] }]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

type BrandLockupProps = {
  size: number;
  layout?: "inline" | "stacked";
  showWordmark?: boolean;
  showDescriptor?: boolean;
  descriptor?: string;
  wordmarkStyle?: StyleProp<TextStyle>;
  descriptorStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export function BrandLockup({
  size,
  layout = "inline",
  showWordmark = true,
  showDescriptor = false,
  descriptor = BRAND.compactDescriptor,
  wordmarkStyle,
  descriptorStyle,
  style,
}: BrandLockupProps) {
  const { colors } = useThemePrefs();
  const stacked = layout === "stacked";

  return (
    <View style={[stacked ? styles.stacked : styles.inline, style]}>
      <BrandMark size={size} />
      {showWordmark ? (
        <View style={stacked ? styles.copyStacked : styles.copyInline}>
          <Text style={[styles.wordmark, { color: colors.text }, stacked && styles.wordmarkStacked, wordmarkStyle]}>
            {BRAND.appName}
          </Text>
          {showDescriptor ? (
            <Text style={[styles.descriptor, { color: colors.muted }, descriptorStyle]} numberOfLines={1}>
              {descriptor}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: "row",
    alignItems: "center",
  },
  stacked: {
    flexDirection: "column",
    alignItems: "center",
  },
  copyInline: {
    marginLeft: 6,
    justifyContent: "center",
  },
  copyStacked: {
    marginTop: 10,
    alignItems: "center",
  },
  wordmark: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  wordmarkStacked: {
    fontSize: 22,
  },
  descriptor: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "500",
  },
});
