import { translate } from "@/lib/i18n";

/**
 * Normalize API / thrown error strings for UI — never show raw Forbidden / ApiClientError.
 * Unknown backend text is left as written. Only the stable application messages are catalogued.
 */
export function toUserFacingApiError(
  message: string | null | undefined,
  fallback = translate("errors.unableToLoadData")
): string {
  const unavailable = translate("errors.unavailableForRole");
  if (!message || !message.trim()) return fallback;
  const m = message.trim();
  const lower = m.toLowerCase();
  if (
    lower === "forbidden" ||
    lower.includes("insufficient permissions") ||
    lower.includes("apiclierror") ||
    lower.startsWith("apicli") ||
    lower.includes("api client error")
  ) {
    return unavailable;
  }
  if (lower.includes("apiclierror:") || /^api\s*client\s*error/i.test(m)) {
    return unavailable;
  }
  const stripped = m.replace(/^ApiClientError:\s*/i, "").trim();
  if (!stripped || stripped.toLowerCase() === "forbidden") {
    return unavailable;
  }
  return stripped;
}
