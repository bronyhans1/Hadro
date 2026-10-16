import { View, Text, StyleSheet } from "react-native";
import { useThemePrefs } from "@/store/theme";
import { translate } from "@/lib/i18n";

export default function PayslipsPlaceholderScreen() {
  const { colors } = useThemePrefs();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{translate("payroll.payslips")}</Text>
      <Text style={[styles.muted, { color: colors.muted }]}>
        {translate("payroll.payslipsFuture")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: "800" },
  muted: { fontSize: 14, marginTop: 8, lineHeight: 20 },
});
