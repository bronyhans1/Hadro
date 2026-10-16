/**
 * Shared presentation helpers for stored enum/code values.
 * Keep in sync with frontend/lib/format/displayLabels.ts
 * Never mutate DB values — display only.
 */
import { translateLabel } from "@/lib/i18n";

/** snake_case / kebab-case / spaced codes → Title Case words. */
export function humanizeEnumKey(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Human-readable gender label. Pass-through empty as "—". */
export function formatGenderLabel(value: string | null | undefined): string {
  if (value == null || !String(value).trim()) return "—";
  const key = String(value).trim().toLowerCase().replace(/-/g, "_");
  return translateLabel(`profile.gender.${key}`, humanizeEnumKey(String(value)));
}

/** Human-readable account status label. */
export function formatAccountStatusLabel(value: string | null | undefined): string {
  if (value == null || !String(value).trim()) return "—";
  const key = String(value).trim().toLowerCase();
  return translateLabel(`profile.accountStatus.${key}`, humanizeEnumKey(String(value)));
}
