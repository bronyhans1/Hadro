import { translate } from "./translate";

/** Stable audit action codes. Unknown legacy strings return null so callers can keep stored text. */
const AUDIT_ACTION_KEYS: Record<string, string> = {
  company_profile_updated: "audit.companyProfileUpdated",
  company_profile_setup_dismissed: "audit.companyProfileSetupDismissed",
  "platform.company_profile_updated": "audit.platformCompanyProfileUpdated",
  leave_compensation_overridden: "audit.leaveCompensationOverridden",
};

export function presentStructuredAuditAction(action: string): string | null {
  const key = AUDIT_ACTION_KEYS[(action ?? "").trim()];
  return key ? translate(key) : null;
}
