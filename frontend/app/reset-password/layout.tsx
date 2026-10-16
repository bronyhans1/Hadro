import type { Metadata } from "next";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = {
  title: translate("auth.resetPasswordTitle"),
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
