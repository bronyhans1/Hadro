import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useThemePrefs } from "@/store/theme";
import { useRouter } from "expo-router";
import { getUnreadCount } from "@/lib/api/notifications.api";
import { isApiError } from "@/types/api";
import { NOTIFICATION_UNREAD_BADGE_COLOR } from "@/lib/notifications/notificationPresentation";
import { BrandLockup } from "@/components/brand/BrandMark";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function AppTopBar({ feature }: { feature: string }) {
  const { colors } = useThemePrefs();
  const { t } = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === "android" ? 8 : 0);

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const res = await getUnreadCount();
      if (isApiError(res)) throw new Error(res.error);
      return res.data.unread;
    },
    refetchInterval: 60_000,
  });
  const unread = unreadQuery.data ?? 0;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: topPad,
        },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.rowSides}>
          <View style={styles.side}>
            <Text style={[styles.feature, { color: colors.muted }]} numberOfLines={1}>
              {feature}
            </Text>
          </View>
          <View style={[styles.side, styles.sideRight]}>
            <Pressable
              onPress={() => router.push("/notifications")}
              android_ripple={{ color: `${colors.primary}33`, borderless: true }}
              style={({ pressed }) => [
                styles.bellBtn,
                {
                  backgroundColor: pressed ? colors.surfaceMuted : "transparent",
                },
                ...(pressed && Platform.OS === "ios" ? [{ opacity: 0.88 } as const] : []),
              ]}
              accessibilityLabel={t("navigation.notifications")}
              hitSlop={12}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {unread > 0 ? (
                <View style={[styles.badge, { backgroundColor: NOTIFICATION_UNREAD_BADGE_COLOR }]}>
                  <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>
        <View style={styles.centerTitleAbs} pointerEvents="box-none">
          <BrandLockup
            size={22}
            wordmarkStyle={[styles.brand, { color: colors.text }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  inner: {
    position: "relative",
    minHeight: 52,
    justifyContent: "center",
  },
  rowSides: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  side: {
    flex: 1,
    minWidth: 0,
  },
  sideRight: {
    alignItems: "flex-end",
  },
  centerTitleAbs: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  feature: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  brand: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  bellBtn: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});
