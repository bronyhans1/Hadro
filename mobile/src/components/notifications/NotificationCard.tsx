import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemePrefs } from "@/store/theme";
import { pressStyle } from "@/lib/pressFeedback";
import type { NotificationRow } from "@/lib/api/notifications.api";
import {
  formatNotificationWhen,
  getNotificationVisual,
  NOTIFICATION_UNREAD_BADGE_COLOR,
  toneColors,
} from "@/lib/notifications/notificationPresentation";

type Props = {
  item: NotificationRow;
  onPress?: () => void;
};

export function NotificationCard({ item, onPress }: Props) {
  const { colors, mode } = useThemePrefs();
  const unread = !item.read_at;
  const visual = getNotificationVisual(item.type);
  const tone = toneColors(visual.tone, colors);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: unread ? colors.surface : colors.surfaceMuted,
          borderColor: unread ? `${NOTIFICATION_UNREAD_BADGE_COLOR}40` : colors.border,
          shadowColor: colors.shadow,
        },
        onPress ? pressStyle({ pressed }, { scale: 0.995 }) : null,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
        <Ionicons name={visual.icon} size={22} color={tone.fg} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {unread ? (
            <View style={[styles.dot, { backgroundColor: NOTIFICATION_UNREAD_BADGE_COLOR }]} />
          ) : null}
        </View>
        <Text
          style={[styles.message, { color: colors.muted }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.body}
        </Text>
        <Text style={[styles.time, { color: colors.muted }]}>
          {formatNotificationWhen(item.created_at)}
        </Text>
      </View>
      {onPress && unread ? (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} style={styles.chevron} />
      ) : null}
      {mode === "dark" && unread ? (
        <View style={[styles.unreadStripe, { backgroundColor: NOTIFICATION_UNREAD_BADGE_COLOR }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  unreadStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  chevron: {
    marginTop: 12,
    marginLeft: 4,
  },
});
