import { View, Text, StyleSheet } from "react-native";
import { useThemePrefs } from "@/store/theme";
import { SessionHistoryList } from "@/screens/SessionHistoryScreen";
import { translate } from "@/lib/i18n";

/** History tab: in-page title + list below `AppTopBar` (no native stack header on this screen). */
export default function HistoryScreen() {
  const { colors } = useThemePrefs();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{translate("navigation.history")}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {translate("attendance.historyGroupedSubtitle")}
        </Text>
      </View>
      <SessionHistoryList />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 22,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 12,
  },
});
