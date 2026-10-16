import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemePrefs } from "@/store/theme";
import { pressStyle } from "@/lib/pressFeedback";
import type { NotificationRow } from "@/lib/api/notifications.api";
import {
  formatNotificationWhen,
  getNotificationVisual,
  toneColors,
} from "@/lib/notifications/notificationPresentation";
import { translate } from "@/lib/i18n";

type Props = {
  item: NotificationRow | null;
  visible: boolean;
  onClose: () => void;
};

export function NotificationDetailModal({ item, visible, onClose }: Props) {
  const { colors } = useThemePrefs();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  if (!item) return null;

  const visual = getNotificationVisual(item.type);
  const tone = toneColors(visual.tone, colors);
  const unread = !item.read_at;
  const sheetMaxHeight = Math.min(height * 0.88, height - insets.top - 24);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlayScrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={translate("notifications.dismiss")} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              maxHeight: sheetMaxHeight,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
              <Ionicons name={visual.icon} size={26} color={tone.fg} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.time, { color: colors.muted }]}>
                {formatNotificationWhen(item.created_at)}
                {unread ? translate("notifications.unreadSuffix") : ""}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel={translate("common.close")}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: colors.surfaceMuted },
                pressStyle({ pressed }),
              ]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            bounces
            keyboardShouldPersistTaps="handled"
          >
            {/* Full body — no numberOfLines, ellipsis, or fixed height clipping */}
            <Text style={[styles.body, { color: colors.text }]}>{item.body}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  time: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
});
