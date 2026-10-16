import { useEffect, useRef } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type PanResponderGestureState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemePrefs } from "@/store/theme";
import type { ToastItem, ToastVariant } from "./types";

type Props = {
  item: ToastItem | null;
  onDismiss: () => void;
};

function variantStyles(
  variant: ToastVariant,
  colors: import("@/store/theme").ThemePalette
) {
  if (variant === "error") {
    return {
      bg: colors.surfaceDanger,
      border: colors.danger,
      text: colors.danger,
      icon: "alert-circle" as const,
      iconColor: colors.danger,
    };
  }
  if (variant === "info") {
    return {
      bg: colors.surfaceMuted,
      border: colors.primary,
      text: colors.text,
      icon: "information-circle" as const,
      iconColor: colors.primary,
    };
  }
  return {
    bg: colors.toneSuccessBg,
    border: colors.success,
    text: colors.toneSuccessText,
    icon: "checkmark-circle" as const,
    iconColor: colors.success,
  };
}

export function ToastHost({ item, onDismiss }: Props) {
  const { colors } = useThemePrefs();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissingRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function animateOut(onEnd?: () => void) {
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    clearTimer();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -16, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      dismissingRef.current = false;
      dragY.setValue(0);
      onDismiss();
      onEnd?.();
    });
  }

  useEffect(() => {
    if (!item) {
      opacity.setValue(0);
      translateY.setValue(-12);
      dragY.setValue(0);
      return;
    }

    dismissingRef.current = false;
    clearTimer();
    opacity.setValue(0);
    translateY.setValue(-12);
    dragY.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(() => animateOut(), item.durationMs);

    return () => clearTimer();
  }, [item?.id, item?.durationMs]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g: PanResponderGestureState) => {
        if (g.dy < 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -36 || g.vy < -0.5) {
          animateOut();
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
        }
      },
    })
  ).current;

  if (!item) return null;

  const tone = variantStyles(item.variant, colors);
  const combinedY = Animated.add(translateY, dragY);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingTop: Math.max(insets.top, 8) + 6 }]}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.toast,
          {
            backgroundColor: tone.bg,
            borderColor: tone.border,
            shadowColor: colors.shadow,
            opacity,
            transform: [{ translateY: combinedY }],
          },
        ]}
      >
        <Ionicons name={tone.icon} size={22} color={tone.iconColor} />
        <View style={styles.textCol}>
          <Text style={[styles.message, { color: tone.text }]} numberOfLines={2}>
            {item.message}
          </Text>
          {item.subtitle ? (
            <Text style={[styles.subtitle, { color: tone.text }]} numberOfLines={3}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  textCol: { flex: 1, minWidth: 0 },
  message: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  subtitle: { fontSize: 12, marginTop: 3, lineHeight: 17, opacity: 0.92 },
});
