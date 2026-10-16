import { View, Text, Image, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ThemePalette } from "@/store/theme";
import { translate } from "@/lib/i18n";

type Props = {
  colors: ThemePalette;
  displayName: string;
  email: string;
  roles: string;
  companyName?: string | null;
  branchName?: string | null;
  departmentName?: string | null;
  avatarSource: { uri: string } | null;
  onPhotoPress: () => void;
  uploadingPhoto?: boolean;
};

export function ProfileHeaderCard({
  colors,
  displayName,
  email,
  roles,
  companyName,
  branchName,
  departmentName,
  avatarSource,
  onPhotoPress,
  uploadingPhoto,
}: Props) {
  return (
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
      <Pressable onPress={onPhotoPress} style={styles.avatarPress}>
        <View style={[styles.avatarRing, { borderColor: `${colors.primary}44` }]}>
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                {displayName.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={14} color={colors.onPrimary} />
          </View>
        </View>
      </Pressable>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {displayName}
      </Text>
      <Text style={[styles.role, { color: colors.primary }]}>{roles}</Text>
      <Text style={[styles.email, { color: colors.muted }]}>{email}</Text>
      {companyName ? (
        <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
          <Ionicons name="business-outline" size={16} color={colors.muted} />
          <Text style={[styles.metaText, { color: colors.muted }]}>{companyName}</Text>
        </View>
      ) : null}
      {branchName ? (
        <Text style={[styles.metaSub, { color: colors.muted }]}>
          {translate("profile.branchMeta", { values: { name: branchName } })}
        </Text>
      ) : null}
      {departmentName ? (
        <Text style={[styles.metaSub, { color: colors.muted }]}>
          {translate("profile.deptMeta", { values: { name: departmentName } })}
        </Text>
      ) : null}
      {uploadingPhoto ? (
        <Text style={[styles.uploadHint, { color: colors.muted }]}>{translate("profile.uploadingPhoto")}</Text>
      ) : (
        <Text style={[styles.uploadHint, { color: colors.muted }]}>{translate("profile.tapPhotoToUpdate")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  avatarPress: { marginBottom: 14 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 36, fontWeight: "800" },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  role: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  email: { fontSize: 14, marginTop: 4, textAlign: "center" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: "100%",
    justifyContent: "center",
  },
  metaText: { fontSize: 14, fontWeight: "600" },
  metaSub: { fontSize: 13, marginTop: 4, textAlign: "center" },
  uploadHint: { fontSize: 12, marginTop: 10 },
});
