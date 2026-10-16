import { View, Text, Pressable, StyleSheet } from "react-native";
import type { ThemePalette } from "@/store/theme";
import { pressStyle } from "@/lib/pressFeedback";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export type ProfileSection = "personal" | "work" | "security" | "preferences";

const TABS: { key: ProfileSection; labelKey: string }[] = [
  { key: "personal", labelKey: "navigation.personal" },
  { key: "work", labelKey: "navigation.work" },
  { key: "security", labelKey: "security.title" },
  { key: "preferences", labelKey: "navigation.prefs" },
];

type Props = {
  active: ProfileSection;
  onChange: (section: ProfileSection) => void;
  colors: ThemePalette;
};

export function ProfileSectionTabs({ active, onChange, colors }: Props) {
  const { t } = useLocale();
  return (
    <View style={styles.row}>
      {TABS.map((tab) => {
        const selected = active === tab.key;
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
              pressStyle({ pressed }),
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.onPrimary : colors.text },
              ]}
            >
              {t(tab.labelKey)}
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
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});
