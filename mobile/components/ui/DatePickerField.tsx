import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useThemePrefs, type ThemePalette } from "@/store/theme";
import { formatDisplayDate, formatYmd, parseYmd, startOfToday } from "@/lib/dates";
import { pressStyle } from "@/lib/pressFeedback";
import { translate } from "@/lib/i18n";

type Props = {
  label: string;
  value: string;
  onChange: (ymd: string) => void;
  colors: ThemePalette;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

function stableDateKey(date?: Date): number | null {
  return date ? date.getTime() : null;
}

export function DatePickerField({
  label,
  value,
  onChange,
  colors,
  placeholder = translate("common.selectDate"),
  minimumDate,
  maximumDate,
}: Props) {
  const { mode: themeMode } = useThemePrefs();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => parseYmd(value) ?? startOfToday());

  const stableMinimum = useMemo(
    () => minimumDate,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compare by calendar instant, not reference
    [stableDateKey(minimumDate)]
  );
  const stableMaximum = useMemo(
    () => maximumDate,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stableDateKey(maximumDate)]
  );

  const display = value ? formatDisplayDate(value) : placeholder;
  const hasValue = Boolean(value?.trim());

  const pickerValue = useMemo(() => parseYmd(value) ?? draft, [value, draft]);

  useEffect(() => {
    const parsed = parseYmd(value);
    if (parsed) setDraft(parsed);
  }, [value]);

  function openPicker() {
    setDraft(parseYmd(value) ?? startOfToday());
    setOpen(true);
  }

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        setOpen(false);
        return;
      }
      if (event.type === "set" && selected) {
        setOpen(false);
        onChange(formatYmd(selected));
      }
      return;
    }
    if (selected) setDraft(selected);
  }

  function confirmIos() {
    onChange(formatYmd(draft));
    setOpen(false);
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          {
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
          },
          pressStyle({ pressed }),
        ]}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <Text
          style={[
            styles.value,
            { color: hasValue ? colors.text : colors.muted },
          ]}
          numberOfLines={1}
        >
          {display}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>

      {Platform.OS === "ios" ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
            <Pressable
              style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                  <Text style={[styles.sheetAction, { color: colors.muted }]}>{translate("common.cancel")}</Text>
                </Pressable>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>{label}</Text>
                <Pressable onPress={confirmIos} hitSlop={8}>
                  <Text style={[styles.sheetAction, { color: colors.primary, fontWeight: "700" }]}>
                    {translate("common.done")}
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="spinner"
                minimumDate={stableMinimum}
                maximumDate={stableMaximum}
                onChange={onPickerChange}
                themeVariant={themeMode === "dark" ? "dark" : "light"}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {Platform.OS === "android" && open ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          minimumDate={stableMinimum}
          maximumDate={stableMaximum}
          onChange={onPickerChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  label: { fontWeight: "600", marginBottom: 6, fontSize: 13 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  value: { flex: 1, fontSize: 16, fontWeight: "500" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  sheetAction: { fontSize: 16 },
});
