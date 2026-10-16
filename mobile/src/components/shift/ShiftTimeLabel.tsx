import { Text, StyleSheet, type TextStyle } from "react-native";
import { formatShiftTimeRange } from "@/lib/shiftDisplay";

type Props = {
  start_time: string;
  end_time: string;
  spans_midnight?: boolean;
  is_active?: boolean | null;
  color?: string;
  mutedColor?: string;
  style?: TextStyle;
};

/** Shift wall-clock range with overnight "(next day)" suffix — web parity. */
export function ShiftTimeLabel({
  start_time,
  end_time,
  spans_midnight,
  is_active,
  color,
  mutedColor,
  style,
}: Props) {
  const range = formatShiftTimeRange({ start_time, end_time, spans_midnight });
  const inactive = is_active === false;

  return (
    <Text style={[styles.base, style, color ? { color } : null]}>
      {range}
      {inactive ? (
        <Text style={[styles.inactive, mutedColor ? { color: mutedColor } : null]}> · Inactive</Text>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { fontSize: 15, fontWeight: "600" },
  inactive: { fontSize: 13, fontWeight: "600" },
});
