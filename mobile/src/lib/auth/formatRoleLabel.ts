/**
 * Friendly labels for stored role codes. Never show raw DB values to users.
 * Keep in sync with frontend/lib/navigation/formatRoleLabel.ts
 */
import { humanizeEnumKey } from "@/lib/format/displayLabels";
import { translate, translateLabel } from "@/lib/i18n";

function normalizeRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/-/g, "_");
}

export function formatRoleLabel(role: string): string {
  const key = normalizeRoleKey(role);
  return translateLabel(`permissions.roles.${key}`, humanizeEnumKey(role));
}

export function formatRolesList(
  roles: readonly string[] | undefined,
  separator = " · "
): string {
  if (!roles?.length) return translate("permissions.roles.employee");
  return roles.map(formatRoleLabel).join(separator);
}
