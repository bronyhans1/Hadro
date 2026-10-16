import type { AppRole } from "@/lib/types/auth";
import { humanizeEnumKey } from "@/lib/format/displayLabels";
import { translate, translateLabel } from "@/lib/i18n";

/**
 * Friendly labels for stored role codes. Never show raw DB values to users.
 */
function normalizeRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/-/g, "_");
}

/** Human-readable label for a stored role value. Does not mutate the underlying role. */
export function formatRoleLabel(role: AppRole | string): string {
  const key = normalizeRoleKey(role);
  return translateLabel(`permissions.roles.${key}`, humanizeEnumKey(role));
}

export function formatRolesList(
  roles: readonly (AppRole | string)[] | undefined,
  separator = " · "
): string {
  if (!roles?.length) return translate("permissions.user");
  return roles.map(formatRoleLabel).join(separator);
}
