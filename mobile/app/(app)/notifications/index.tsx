import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUnreadCount,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from "@/lib/api/notifications.api";
import { useThemePrefs } from "@/store/theme";
import { pressStyle } from "@/lib/pressFeedback";
import { isApiError } from "@/types/api";
import { NotificationEmptyState } from "@/components/notifications/NotificationEmptyState";
import { NotificationSearchBar } from "@/components/notifications/NotificationSearchBar";
import {
  NotificationFilterTabs,
  type NotificationFilter,
} from "@/components/notifications/NotificationFilterTabs";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { NotificationDetailModal } from "@/components/notifications/NotificationDetailModal";
import { matchesNotificationSearch } from "@/lib/notifications/notificationPresentation";
import { themedRefreshControlProps } from "@/lib/themedRefreshControl";
import { translate } from "@/lib/i18n";

const SCREEN_PADDING = 22;

export default function NotificationsScreen() {
  const { colors } = useThemePrefs();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<NotificationRow | null>(null);

  const listQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const res = await listMyNotifications({ page: 1, limit: 50 });
      if (isApiError(res)) throw new Error(res.error);
      return res.data;
    },
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const res = await getUnreadCount();
      if (isApiError(res)) throw new Error(res.error);
      return res.data.unread;
    },
  });

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  const rows = listQuery.data?.rows ?? [];
  const unreadCount = unreadQuery.data ?? 0;

  const tabCounts = useMemo(() => {
    const unread = rows.filter((r) => !r.read_at).length;
    return {
      all: rows.length,
      unread,
      read: rows.length - unread,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filter === "unread" && row.read_at) return false;
      if (filter === "read" && !row.read_at) return false;
      return matchesNotificationSearch(row, search);
    });
  }, [rows, filter, search]);

  const emptyVariant = useMemo(() => {
    if (rows.length === 0) return "default" as const;
    if (search.trim()) return "search" as const;
    return "filtered" as const;
  }, [rows.length, search]);

  async function handleOpenNotification(item: NotificationRow) {
    setSelected(item);
    if (!item.read_at) {
      await markNotificationRead(item.id);
      setSelected({ ...item, read_at: new Date().toISOString() });
      await onRefresh();
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    await onRefresh();
  }

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{translate("notifications.title")}</Text>
          <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
            {unreadCount > 0
              ? translate("notifications.unreadStayOnTop", { values: { count: unreadCount } })
              : translate("notifications.upToDate")}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <Pressable
            onPress={() => void handleMarkAll()}
            style={({ pressed }) => [
              styles.markAllBtn,
              { borderColor: colors.border, backgroundColor: colors.surface },
              pressStyle({ pressed }),
            ]}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>{translate("notifications.markAllRead")}</Text>
          </Pressable>
        ) : null}
      </View>

      <NotificationSearchBar
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch("")}
      />

      <View style={styles.tabsWrap}>
        <NotificationFilterTabs active={filter} onChange={setFilter} counts={tabCounts} />
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {listQuery.isLoading && !listQuery.data ? (
        <View style={styles.loadingWrap}>
          {listHeader}
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredRows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onPress={() => void handleOpenNotification(item)}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<NotificationEmptyState variant={emptyVariant} />}
          contentContainerStyle={[
            styles.listContent,
            filteredRows.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={listQuery.isRefetching}
              onRefresh={onRefresh}
              {...themedRefreshControlProps(colors)}
            />
          }
        />
      )}

      <NotificationDetailModal
        item={selected}
        visible={selected !== null}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  markAllBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tabsWrap: {
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  loadingWrap: {
    flex: 1,
    paddingBottom: 40,
  },
});
