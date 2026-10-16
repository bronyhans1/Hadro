import { Alert } from "react-native";
import { translate } from "@/lib/i18n";

export const LOGOUT_CONFIRM_TITLE = "Log out?";
export const LOGOUT_CONFIRM_MESSAGE = "Are you sure you want to log out of HADRO?";

export type ConfirmLogoutOptions = {
  onConfirm: () => void | Promise<void>;
  /** Optional extra warning (e.g. active clock-in) — reserved for future safeguards. */
  extraMessage?: string;
};

/**
 * Native confirmation before logout. Keeps copy and Alert wiring in one place
 * so future safeguards (clocked-in warning, etc.) can extend `extraMessage`.
 */
export function confirmLogout({ onConfirm, extraMessage }: ConfirmLogoutOptions): void {
  const body = translate("auth.logOutOfHadro");
  const message = extraMessage ? `${body}\n\n${extraMessage}` : body;

  Alert.alert(
    translate("auth.logOutQuestion"),
    message,
    [
      { text: translate("common.cancel"), style: "cancel" },
      {
        text: translate("auth.logOut"),
        style: "destructive",
        onPress: () => {
          void onConfirm();
        },
      },
    ],
    { cancelable: true }
  );
}
