"use client";

import { SuccessBanner } from "@/components/ui/SuccessBanner";
import { translate } from "@/lib/i18n";

/** Non-blocking confirmation after a file download is triggered. */
export function ExportSuccessNotice({ message }: { message: string | null }) {
  return (
    <SuccessBanner
      open={Boolean(message)}
      title={translate("common.exportReady")}
      description={message ?? undefined}
    />
  );
}
