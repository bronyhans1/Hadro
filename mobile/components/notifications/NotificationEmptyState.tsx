import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemePrefs } from "@/store/theme";
import { translate } from "@/lib/i18n";

type Variant = "default" | "filtered" | "search";

const COPY: Record<
  Variant,
  { titleKey: string; subtitleKey: string; helperKey?: string }
> = {
  default: {
    titleKey: "notifications.caughtUp",
    subtitleKey: "notifications.noneRightNow",
    helperKey: "notifications.notifyWhenImportant",
  },
  filtered: {
    titleKey: "notifications.nothingInTab",
    subtitleKey: "notifications.tryAnotherFilter",
  },
  search: {
    titleKey: "notifications.noMatches",
    subtitleKey: "notifications.tryDifferentSearch",
  },
};

export function NotificationEmptyState({ variant = "default" }: { variant?: Variant }) {
  const { colors, mode } = useThemePrefs();
  const copy = COPY[variant];
  const title = translate(copy.titleKey);
  const subtitle = translate(copy.subtitleKey);
  const helper = copy.helperKey ? translate(copy.helperKey) : undefined;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.iconRing,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={[styles.iconInner, { backgroundColor: `${colors.primary}14` }]}>
          <Ionicons
            name={variant === "search" ? "search-outline" : "notifications-off-outline"}
            size={40}
            color={colors.primary}
          />
        </View>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
      {helper ? (
        <Text style={[styles.helper, { color: colors.muted, opacity: mode === "dark" ? 0.85 : 0.9 }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 32,
  },
  iconRing: {
    borderRadius: 999,
    borderWidth: 1,
    padding: 6,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 280,
  },
  helper: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 260,
  },
});
