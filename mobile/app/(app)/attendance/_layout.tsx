import { Stack } from "expo-router";

export default function AttendanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="check-in" />
      <Stack.Screen name="check-out" />
      <Stack.Screen name="remote-check-in" />
      <Stack.Screen name="remote-check-out" />
      <Stack.Screen name="details" />
    </Stack>
  );
}
