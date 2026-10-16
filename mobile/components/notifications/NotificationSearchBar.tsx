import { View, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemePrefs } from "@/store/theme";
import { translate } from "@/lib/i18n";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
};

export function NotificationSearchBar({ value, onChangeText, onClear }: Props) {
  const { colors } = useThemePrefs();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons name="search-outline" size={18} color={colors.muted} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={translate("notifications.searchPlaceholder")}
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text }]}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => (onClear ? onClear() : onChangeText(""))}
          hitSlop={8}
          accessibilityLabel={translate("notifications.clearSearch")}
        >
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
});
