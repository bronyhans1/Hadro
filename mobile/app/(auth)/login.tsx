import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/store/auth";
import { createClient } from "@supabase/supabase-js";
import { ENV } from "@/lib/env";
import { useThemePrefs } from "@/store/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { translate } from "@/lib/i18n";
import { BRAND, LEGAL_LINKS } from "@/lib/branding";
import { BrandMark } from "@/components/brand/BrandMark";

const LOGIN_BG_LIGHT_PNG = require("../../assets/brand/login-bg-light.png");
const LOGIN_BG_DARK_PNG = require("../../assets/brand/login-bg-dark.png");

export default function LoginScreen() {
  const router = useRouter();
  const { login, user, isLoading, platformAdminWebOnly, accountAccessBlocked, clearAccountAccessBlocked } =
    useAuth();
  const { colors, mode } = useThemePrefs();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const supabase =
    ENV.EXPO_PUBLIC_SUPABASE_URL && ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY
      ? createClient(ENV.EXPO_PUBLIC_SUPABASE_URL, ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY)
      : null;

  /** Never navigate during render — only after commit (avoids React concurrent warning). */
  useEffect(() => {
    if (isLoading) return;
    if (platformAdminWebOnly) {
      router.replace("/(auth)/platform-admin-web-only");
      return;
    }
    if (user) {
      router.replace("/home");
    }
  }, [user, isLoading, platformAdminWebOnly, router]);

  const artOpacity = mode === "dark" ? 0.12 : 0.2;
  const bgSource = mode === "dark" ? LOGIN_BG_DARK_PNG : LOGIN_BG_LIGHT_PNG;
  const year = new Date().getFullYear();

  function LegalFooter() {
    return (
      <View style={styles.legalFooter}>
        <Text style={[styles.legalText, { color: colors.muted }]}>{translate("auth.mobileCopyright")} {year}</Text>
        <Text style={[styles.legalSentence, { color: colors.muted }]}>
          {translate("auth.agreePrefix")}{" "}
          <Text
            style={[styles.legalSentenceLink, { color: colors.primary }]}
            onPress={() => Linking.openURL(LEGAL_LINKS.terms)}
            accessibilityRole="link"
          >
            {translate("auth.termsOfService")}
          </Text>{" "}
          {translate("auth.and")}{" "}
          <Text
            style={[styles.legalSentenceLink, { color: colors.primary }]}
            onPress={() => Linking.openURL(LEGAL_LINKS.privacy)}
            accessibilityRole="link"
          >
            {translate("auth.privacyPolicy")}
          </Text>
          .
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.shell, { backgroundColor: colors.background }]}>
        <View style={[styles.artLayer, { opacity: artOpacity }]} pointerEvents="none">
          <Image
            source={bgSource}
            style={styles.artImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            importantForAccessibility="no"
          />
        </View>
        <View style={styles.centeredOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <SafeAreaView pointerEvents="none" style={styles.safeAreaFooterOnly}>
          <LegalFooter />
        </SafeAreaView>
      </View>
    );
  }

  if (platformAdminWebOnly) {
    return (
      <View style={[styles.shell, { backgroundColor: colors.background }]}>
        <View style={[styles.artLayer, { opacity: artOpacity }]} pointerEvents="none">
          <Image
            source={bgSource}
            style={styles.artImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            importantForAccessibility="no"
          />
        </View>
        <View style={styles.centeredOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <SafeAreaView pointerEvents="none" style={styles.safeAreaFooterOnly}>
          <LegalFooter />
        </SafeAreaView>
      </View>
    );
  }

  if (user) {
    return null;
  }

  async function handleSubmit() {
    setError(null);
    setInfo(null);
    clearAccountAccessBlocked();
    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.ok && !result.accessBlocked) {
        setError(result.error ?? translate("auth.loginFailed"));
      }
      /** Success: redirect runs in useEffect when `user` updates */
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setInfo(null);
    const normalized = email.trim();
    if (!normalized) {
      setError(translate("auth.forgotEmailFirstShort"));
      return;
    }
    if (!supabase) {
      setError(translate("auth.resetUnavailableShort"));
      return;
    }
    setResetting(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(normalized);
      if (resetErr) {
        setError(resetErr.message);
        return;
      }
      setInfo(translate("auth.resetLinkSentShort"));
    } finally {
      setResetting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: colors.background }]}>
      <View style={[styles.artLayer, { opacity: artOpacity }]} pointerEvents="none">
        <Image
          source={bgSource}
          style={styles.artImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          importantForAccessibility="no"
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.safeArea}
      >
        <View style={styles.main}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.logoWrap}>
              <BrandMark size={108} fit="contain" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{translate("auth.welcomeBack")}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {translate("auth.signInToContinue")}
            </Text>

            {(accountAccessBlocked?.message || error) ? (
              <View style={[styles.errorBox, { backgroundColor: colors.surfaceDanger }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {accountAccessBlocked?.message ?? error}
                </Text>
              </View>
            ) : null}
            {info ? (
              <View style={[styles.infoBox, { backgroundColor: colors.toneSuccessBg, borderColor: colors.border }]}>
                <Text style={[styles.infoText, { color: colors.toneSuccessText }]}>{info}</Text>
              </View>
            ) : null}

            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceMuted },
              ]}
              placeholder={translate("auth.email")}
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <View style={styles.passwordWrap}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceMuted },
                ]}
                placeholder={translate("auth.password")}
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inlineRow}>
              <View />
              <TouchableOpacity
                onPress={() => void handleForgotPassword()}
                disabled={submitting || resetting}
                accessibilityState={{ disabled: submitting || resetting, busy: resetting }}
              >
                {resetting ? (
                  <View style={styles.inlineLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.link, { color: colors.primary }]}>{translate("auth.sending")}</Text>
                  </View>
                ) : (
                  <Text style={[styles.link, { color: colors.primary, opacity: submitting ? 0.5 : 1 }]}>
                    {translate("auth.forgotPassword")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary },
                submitting && styles.buttonDisabled,
              ]}
              onPress={() => void handleSubmit()}
              disabled={submitting || resetting || !email.trim() || !password}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityState={{ disabled: submitting || resetting, busy: submitting }}
              accessibilityLabel={submitting ? translate("auth.signingInLabel") : translate("auth.signIn")}
            >
              {submitting ? (
                <View style={styles.buttonLoading}>
                  <ActivityIndicator color={colors.onPrimary} />
                  <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{translate("auth.signingIn")}</Text>
                </View>
              ) : (
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{translate("auth.signIn")}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${BRAND.supportEmail}`)}
                accessibilityRole="link"
              >
                <Text style={[styles.supportLink, { color: colors.primary }]}>{translate("auth.needHelp")}</Text>
              </TouchableOpacity>
              <Text style={[styles.version, { color: colors.muted }]}>
                {BRAND.versionLabel}
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <LegalFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  artLayer: {
    ...StyleSheet.absoluteFill,
  },
  artImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  centeredOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
  },
  safeAreaFooterOnly: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 14,
    padding: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  errorBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 44,
    marginBottom: 0,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 13,
  },
  button: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  inlineRow: {
    marginTop: 12,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "center",
  },
  link: {
    fontSize: 13,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  supportLink: {
    fontSize: 12,
    fontWeight: "600",
  },
  version: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
  },
  legalFooter: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: "center",
  },
  legalText: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.86,
  },
  legalSentence: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    opacity: 0.9,
  },
  legalSentenceLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },
});
