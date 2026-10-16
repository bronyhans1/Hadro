import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ThemePalette } from "@/store/theme";
import type { ChecklistItem } from "@/components/ProfileCompletionChecklist";
import { pressStyle } from "@/lib/pressFeedback";
import { translate } from "@/lib/i18n";

type Props = {
  colors: ThemePalette;
  items: ChecklistItem[];
  blocking?: boolean;
};

export function ProfileCompletionSummary({ colors, items, blocking }: Props) {
  const [expanded, setExpanded] = useState(false);
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: blocking ? colors.primary : colors.border,
        },
      ]}
    >
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.header, pressStyle({ pressed })]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>{translate("profile.profileCompletion")}</Text>
          <Text style={[styles.pct, { color: colors.primary }]}>{pct}%</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.viewDetails, { color: colors.primary }]}>
            {expanded ? translate("profile.hideDetails") : translate("employees.viewDetails")}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.primary}
          />
        </View>
      </Pressable>
      <View style={[styles.barBg, { backgroundColor: colors.border }]}>
        <View
          style={[styles.barFill, { width: `${pct}%`, backgroundColor: colors.primary }]}
        />
      </View>
      {blocking ? (
        <Text style={[styles.hint, { color: colors.muted }]}>
          {translate("profile.completeRequiredToUnlock")}
        </Text>
      ) : null}

      {expanded ? (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.key} style={styles.row}>
              <Ionicons
                name={item.done ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={item.done ? colors.success : colors.muted}
              />
              <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
              {!item.done ? (
                item.required ? (
                  <Text style={[styles.req, { color: colors.primary }]}>{translate("profile.required")}</Text>
                ) : (
                  <Text style={[styles.rec, { color: colors.muted }]}>{translate("profile.recommended")}</Text>
                )
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  title: { fontSize: 15, fontWeight: "700" },
  pct: { fontSize: 18, fontWeight: "800" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewDetails: { fontSize: 12, fontWeight: "700" },
  barBg: {
    height: 6,
    borderRadius: 999,
    marginTop: 12,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 999 },
  hint: { fontSize: 12, marginTop: 10, lineHeight: 18 },
  list: { marginTop: 14, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  req: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  rec: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
});
