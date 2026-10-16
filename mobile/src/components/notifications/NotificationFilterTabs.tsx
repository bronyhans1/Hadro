import { View, Text, Pressable, StyleSheet } from "react-native";
import { useThemePrefs } from "@/store/theme";
import { pressStyle } from "@/lib/pressFeedback";
import { translate } from "@/lib/i18n";

export type NotificationFilter = "all" | "unread" | "read";

const TABS: { key: NotificationFilter; labelKey: string }[] = [
  { key: "all", labelKey: "leave.all" },
  { key: "unread", labelKey: "notifications.unread" },
  { key: "read", labelKey: "notifications.read" },
];

type Props = {
  active: NotificationFilter;
  onChange: (tab: NotificationFilter) => void;
  counts?: { all: number; unread: number; read: number };
};

export function NotificationFilterTabs({ active, onChange, counts }: Props) {
  const { colors } = useThemePrefs();

  return (
    <View style={styles.row}>
      {TABS.map((tab) => {
        const selected = active === tab.key;
        const count = counts?.[tab.key];
        const label = translate(tab.labelKey);
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              },
              pressStyle({ pressed }, { opacity: 0.92 }),
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.onPrimary : colors.text },
              ]}
            >
              {label}
              {count !== undefined ? ` (${count})` : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});
