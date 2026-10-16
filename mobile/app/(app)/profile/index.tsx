import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActionSheetIOS,
  Platform,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { mobileSupabase, useAuth } from "@/store/auth";
import { updateMyProfile, markPasswordChanged } from "@/lib/api/auth.api";
import { isApiError } from "@/types/api";
import { useThemePrefs } from "@/store/theme";
import { getAuthToken, getRefreshToken } from "@/lib/api/client";
import type { ChecklistItem } from "@/components/ProfileCompletionChecklist";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileCompletionSummary } from "@/components/profile/ProfileCompletionSummary";
import {
  ProfileSectionTabs,
  type ProfileSection,
} from "@/components/profile/ProfileSectionTabs";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { useToast } from "@/components/toast";
import { confirmLogout } from "@/lib/auth/confirmLogout";
import { pressStyle } from "@/lib/pressFeedback";
import { formatRolesList } from "@/lib/auth/formatRoleLabel";
import { translate, LOCALE_META, SUPPORTED_LOCALES, rememberAccountLocale } from "@/lib/i18n";
import { noteExplicitAccountLocale } from "@/lib/i18n/AccountLanguageSync";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { mobileLocaleSession } from "@/lib/i18n/storage";
import { profilePhotoErrorMessageKey, uploadProfilePhotoFromUri } from "@/lib/profilePhotoUpload";
import { readProfileSection, writeProfileSection } from "@/lib/profile/profileSectionMemory";

const GENDER_CHIPS = [
  { value: "", labelKey: "profile.notSpecified" },
  { value: "male", labelKey: "profile.gender.male" },
  { value: "female", labelKey: "profile.gender.female" },
  { value: "other", labelKey: "profile.gender.other" },
  { value: "prefer_not_to_say", labelKey: "profile.preferNotToSaySentence" },
] as const;

const SCREEN_PADDING = 22;
const MAX_DOB = new Date();
const MIN_DOB = new Date(1920, 0, 1);

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { preference, setPreference, colors } = useThemePrefs();
  const { locale, setPreference: setLocalePreference } = useLocale();
  const { show: showToast } = useToast();
  const [section, setSection] = useState<ProfileSection>(readProfileSection);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phoneNumber ?? "");
  const [dob, setDob] = useState(user?.dateOfBirth ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [photoUrl, setPhotoUrl] = useState(user?.profilePhotoUrl ?? "");
  const [pendingLocalUri, setPendingLocalUri] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [pendingMime, setPendingMime] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    writeProfileSection(section);
  }, [section]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setPhone(user.phoneNumber ?? "");
    setDob(user.dateOfBirth ?? "");
    setGender(user.gender ?? "");
    setPhotoUrl(user.profilePhotoUrl ?? "");
  }, [user]);

  const checklistItems = useMemo((): ChecklistItem[] => {
    if (!user) return [];
    const c = user.profileCompletion;
    return [
      {
        key: "password",
        label: translate("profile.passwordUpdated"),
        required: true,
        done: !c.missingRequiredFields.includes("password"),
      },
      {
        key: "dob",
        label: translate("profile.dobAdded"),
        required: true,
        done: !c.missingRequiredFields.includes("date_of_birth"),
      },
      {
        key: "phone",
        label: translate("profile.phoneNumber"),
        required: false,
        done: !c.recommendedMissingFields.includes("phone_number"),
      },
      {
        key: "gender",
        label: translate("profile.genderLabel"),
        required: false,
        done: !c.recommendedMissingFields.includes("gender"),
      },
      {
        key: "photo",
        label: translate("profile.profilePhoto"),
        required: false,
        done: !c.recommendedMissingFields.includes("profile_photo_url"),
      },
    ];
  }, [user]);

  const completionBlocking = !!(
    user?.profileCompletion && !user.profileCompletion.requiredComplete
  );

  const performLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const requestLogout = () => {
    confirmLogout({ onConfirm: performLogout });
  };

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(translate("profile.photoPermission"));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setPendingLocalUri(a.uri);
    setPendingFileName(a.fileName ?? null);
    setPendingMime(a.mimeType ?? null);
    setError(null);
    setSaveMessage(null);
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError(translate("profile.cameraPermission"));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setPendingLocalUri(a.uri);
    setPendingFileName(a.fileName ?? null);
    setPendingMime(a.mimeType ?? null);
    setError(null);
  }

  function openPhotoPicker() {
    const title = translate("profile.profilePhoto");
    const message = translate("profile.choosePhotoSource");
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          message,
          options: [translate("common.cancel"), translate("profile.chooseFromLibrary"), translate("profile.takePhoto")],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) void pickFromLibrary();
          if (idx === 2) void pickFromCamera();
        }
      );
    } else {
      Alert.alert(title, message, [
        { text: translate("common.cancel"), style: "cancel" },
        { text: translate("profile.chooseFromLibrary"), onPress: () => void pickFromLibrary() },
        { text: translate("profile.takePhoto"), onPress: () => void pickFromCamera() },
      ]);
    }
  }

  function handleClearPhoto() {
    if (pendingLocalUri) {
      setPendingLocalUri(null);
      setPendingFileName(null);
      setPendingMime(null);
      return;
    }
    setPhotoUrl("");
  }

  async function handleSaveProfile() {
    setError(null);
    setSaveMessage(null);
    setPasswordSuccess(false);
    setSaving(true);

    let finalPhotoUrl = photoUrl.trim() || null;
    let passwordWasUpdated = false;

    if (pendingLocalUri && user?.userId) {
      setUploadingPhoto(true);
      const up = await uploadProfilePhotoFromUri(pendingLocalUri, user.userId, {
        mimeType: pendingMime,
        fileName: pendingFileName,
      });
      setUploadingPhoto(false);
      if ("errorCode" in up) {
        setError(translate(profilePhotoErrorMessageKey(up.errorCode)));
        setSaving(false);
        return;
      }
      finalPhotoUrl = up.publicUrl;
      setPhotoUrl(up.publicUrl);
      setPendingLocalUri(null);
      setPendingFileName(null);
      setPendingMime(null);
    }

    const res = await updateMyProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phone.trim() || null,
      date_of_birth: dob.trim() || null,
      gender: (gender || null) as "male" | "female" | "other" | "prefer_not_to_say" | null,
      profile_photo_url: finalPhotoUrl,
      theme_preference: preference,
    });
    if (isApiError(res)) {
      setError(res.error ?? translate("profile.failedUpdate"));
      setSaving(false);
      return;
    }

    if (newPassword.trim()) {
      if (!mobileSupabase) {
        setError(translate("settings.passwordSupabaseMissing"));
        setSaving(false);
        return;
      }
      const current = await mobileSupabase.auth.getSession();
      if (!current.data.session) {
        const access = await getAuthToken();
        const refresh = await getRefreshToken();
        if (access && refresh) {
          const setRes = await mobileSupabase.auth.setSession({
            access_token: access,
            refresh_token: refresh,
          });
          if (setRes.error) {
            setError(setRes.error.message);
            setSaving(false);
            return;
          }
        }
      }
      const { error: passErr } = await mobileSupabase.auth.updateUser({
        password: newPassword.trim(),
      });
      if (passErr) {
        setError(passErr.message);
        setSaving(false);
        return;
      }
      await markPasswordChanged();
      setNewPassword("");
      passwordWasUpdated = true;
    }

    await refreshUser();
    if (passwordWasUpdated) {
      showToast({
        message: translate("settings.passwordUpdatedSuccess"),
        subtitle: translate("profile.securityImproved"),
        variant: "success",
      });
    } else {
      showToast({
        message: translate("profile.profileSavedShort"),
        variant: "success",
      });
    }
    setSaving(false);
  }

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || translate("profile.yourProfile");
  const avatarSource = pendingLocalUri
    ? { uri: pendingLocalUri }
    : photoUrl
      ? { uri: photoUrl }
      : null;

  function renderPersonal() {
    return (
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Field label={translate("profile.firstName")} value={firstName} onChangeText={setFirstName} colors={colors} />
        <Field label={translate("profile.lastName")} value={lastName} onChangeText={setLastName} colors={colors} />
        <Field
          label={translate("profile.telephone")}
          value={phone}
          onChangeText={setPhone}
          colors={colors}
          keyboardType="phone-pad"
        />
        <DatePickerField
          label={translate("profile.dateOfBirth")}
          value={dob}
          onChange={setDob}
          colors={colors}
          minimumDate={MIN_DOB}
          maximumDate={MAX_DOB}
        />
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>{translate("profile.genderLabel")}</Text>
        <View style={styles.genderRow}>
          {GENDER_CHIPS.map((o) => {
            const selected = gender === o.value;
            return (
              <Pressable
                key={`gender-${o.value || "none"}`}
                onPress={() => setGender(o.value)}
                style={[
                  styles.genderChip,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? `${colors.primary}18` : colors.surfaceMuted,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? colors.primary : colors.text,
                    fontWeight: selected ? "700" : "500",
                    fontSize: 13,
                  }}
                >
                  {translate(o.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {pendingLocalUri || photoUrl ? (
          <Pressable
            onPress={handleClearPhoto}
            style={[styles.ghostBtn, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.muted, fontWeight: "600" }}>
              {pendingLocalUri ? translate("profile.discardPhoto") : translate("profile.removeSavedPhoto")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  function renderWork() {
    return (
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <InfoRow label={translate("profile.company")} value={user?.companyName ?? "—"} colors={colors} />
        <InfoRow label={translate("attendance.branch")} value={user?.branchName ?? "—"} colors={colors} />
        <InfoRow label={translate("attendance.department")} value={user?.department?.name ?? "—"} colors={colors} />
        <InfoRow label={translate("profile.roles")} value={formatRolesList(user?.roles, ", ")} colors={colors} />
        <Text style={[styles.workHint, { color: colors.muted }]}>
          {translate("profile.workManaged")}
        </Text>
      </View>
    );
  }

  function renderSecurity() {
    return (
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{translate("auth.password")}</Text>
        <Text style={[styles.helper, { color: colors.muted }]}>
          {translate("settings.leaveBlankKeepPassword")}
        </Text>
        <View style={styles.passwordInputWrap}>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={translate("auth.newPassword")}
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              styles.passwordFullInput,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
                color: colors.text,
              },
            ]}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordEyeInline}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderPreferences() {
    return (
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{translate("settings.appearance")}</Text>
        <View style={styles.themeRow}>
          {(["light", "dark", "system"] as const).map((opt) => {
            const selected = preference === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => void setPreference(opt)}
                style={[
                  styles.themePill,
                  selected
                    ? { backgroundColor: colors.primary }
                    : { borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surfaceMuted },
                ]}
              >
                <Text
                  style={{
                    color: selected ? colors.onPrimary : colors.text,
                    fontWeight: "700",
                    textTransform: "capitalize",
                  }}
                >
                  {translate(opt === "light" ? "settings.light" : opt === "dark" ? "settings.dark" : "settings.system")}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.cardTitle, { color: colors.text, marginTop: 20 }]}>
          {translate("settings.language")}
        </Text>
        <View
          style={styles.languageRow}
          accessibilityRole="radiogroup"
          accessibilityLabel={translate("settings.language")}
        >
          {SUPPORTED_LOCALES.map((code) => {
            const selected = locale === code;
            const name = LOCALE_META[code].nativeName;
            return (
              <Pressable
                key={code}
                accessibilityRole="radio"
                accessibilityLabel={name}
                accessibilityState={{ selected }}
                onPress={() => {
                  if (!user) return;
                  void (async () => {
                    noteExplicitAccountLocale({ userId: user.userId, locale: code });
                    await setLocalePreference(code);
                    await rememberAccountLocale(mobileLocaleSession, code);
                    const res = await updateMyProfile({ language: code });
                    if (isApiError(res)) {
                      setError(res.error ?? translate("settings.failedSaveLanguage"));
                      return;
                    }
                    await refreshUser();
                  })();
                }}
                style={[
                  styles.languageChip,
                  selected
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                ]}
              >
                <Text
                  style={{
                    color: selected ? colors.onPrimary : colors.text,
                    fontWeight: "700",
                  }}
                >
                  {selected ? `✓ ${name}` : name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>{translate("navigation.profile")}</Text>
        <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
          {translate("profile.subtitle")}
        </Text>

        {user ? (
          <>
            <ProfileHeaderCard
              colors={colors}
              displayName={displayName}
              email={user.email ?? ""}
              roles={formatRolesList(user.roles, ", ")}
              companyName={user.companyName}
              branchName={user.branchName}
              departmentName={user.department?.name}
              avatarSource={avatarSource}
              onPhotoPress={openPhotoPicker}
              uploadingPhoto={uploadingPhoto}
            />
            <ProfileCompletionSummary
              colors={colors}
              items={checklistItems}
              blocking={completionBlocking}
            />
          </>
        ) : null}

        {error ? (
          <View
            style={[
              styles.feedback,
              styles.feedbackRow,
              { backgroundColor: colors.surfaceDanger, borderColor: colors.danger },
            ]}
          >
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={[styles.feedbackText, { color: colors.danger, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}
        <ProfileSectionTabs active={section} onChange={setSection} colors={colors} />

        {section === "personal" && renderPersonal()}
        {section === "work" && renderWork()}
        {section === "security" && renderSecurity()}
        {section === "preferences" && renderPreferences()}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            (saving || uploadingPhoto) && { opacity: 0.85 },
          ]}
          onPress={() => void handleSaveProfile()}
          disabled={saving || uploadingPhoto}
          activeOpacity={0.9}
        >
          {saving || uploadingPhoto ? (
            <View style={styles.buttonLoading}>
              <ActivityIndicator color={colors.onPrimary} />
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                {uploadingPhoto ? translate("profile.uploading") : translate("leave.saving")}
              </Text>
            </View>
          ) : (
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{translate("settings.saveChanges")}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, { borderColor: colors.border }]}
          onPress={() => requestLogout()}
        >
          <Text style={[styles.buttonTextSecondary, { color: colors.muted }]}>{translate("common.signOut")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  colors,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  colors: import("@/store/theme").ThemePalette;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
            color: colors.text,
          },
          props.style,
        ]}
      />
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: import("@/store/theme").ThemePalette;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 8, paddingBottom: 48 },
  pageTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 4 },
  feedback: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  feedbackRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  feedbackText: { fontSize: 14, fontWeight: "600" },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  fieldLabel: { fontWeight: "600", marginBottom: 6, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  genderRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  ghostBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  infoRow: { marginTop: 12 },
  infoLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 16, fontWeight: "600", marginTop: 4 },
  workHint: { fontSize: 13, marginTop: 16, lineHeight: 19 },
  helper: { fontSize: 13, marginTop: 6, lineHeight: 19 },
  passwordInputWrap: { position: "relative", marginTop: 10 },
  passwordFullInput: { paddingRight: 48 },
  passwordEyeInline: { position: "absolute", right: 14, top: 14 },
  themeRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  themePill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  languageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  languageChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: { fontWeight: "700", fontSize: 16 },
  buttonSecondary: {
    marginTop: 10,
    borderWidth: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonTextSecondary: { fontWeight: "700", fontSize: 16 },
});
