import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/store/auth";
import { ToastProvider } from "@/components/toast";
import { ThemeProvider, useThemePrefs } from "@/store/theme";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { AccountLanguageSync } from "@/lib/i18n/AccountLanguageSync";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnReconnect: true,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <LocaleProvider>
            <RootLayoutInner />
          </LocaleProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootLayoutInner() {
  const { mode } = useThemePrefs();
  return (
    <SafeAreaProvider>
      <AccountLanguageSync />
      <ToastProvider>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
