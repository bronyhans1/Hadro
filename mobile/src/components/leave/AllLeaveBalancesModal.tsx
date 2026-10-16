import { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemePalette } from "@/store/theme";
import type { LeaveBalanceItem } from "@/lib/api/leaveBalances.api";
import { LeaveBalanceList } from "@/components/leave/LeaveBalanceCard";
import { pressStyle } from "@/lib/pressFeedback";
import { translate } from "@/lib/i18n";

const SHEET_MAX_HEIGHT_RATIO = 0.85;

type Props = {
  visible: boolean;
  onClose: () => void;
  colors: ThemePalette;
  balances: LeaveBalanceItem[];
};

export function AllLeaveBalancesModal({ visible, onClose, colors, balances }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /** Stable estimate until header onLayout runs (avoids scroll height jump). */
  const [headerHeight, setHeaderHeight] = useState(104);

  const sheetMaxHeight = windowHeight * SHEET_MAX_HEIGHT_RATIO;
  const bottomInset = Math.max(insets.bottom, 16);
  const scrollMaxHeight = Math.max(
    160,
    sheetMaxHeight - headerHeight - bottomInset
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              maxHeight: sheetMaxHeight,
              paddingBottom: bottomInset,
            },
          ]}
        >
          <View
            onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
            style={styles.headerBlock}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{translate("leave.allLeaveBalances")}</Text>
              <Pressable onPress={onClose} hitSlop={12} style={pressStyle({ pressed: false })}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={[styles.sheetSubtitle, { color: colors.muted }]}>
              {translate("leave.allBalancesSubtitle")}
            </Text>
          </View>

          <ScrollView
            style={[styles.scroll, { maxHeight: scrollMaxHeight }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            bounces
          >
            {balances.length === 0 ? (
              <Text style={[styles.emptyAll, { color: colors.muted }]}>
                {translate("leave.noBalancesSetUpYet")}
              </Text>
            ) : (
              <LeaveBalanceList colors={colors} balances={balances} listMarginBottom={0} />
            )}
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
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 16,
  },
  headerBlock: {
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800" },
  sheetSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  emptyAll: { fontSize: 14, lineHeight: 20, textAlign: "center", paddingVertical: 24 },
});
