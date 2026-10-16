/**
 * Public store listing URLs must only be linked when a real https listing is configured.
 * Empty values and known unpublished placeholders stay non-clickable.
 */
export function isPublishedStoreUrl(url: string | null | undefined): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/id0000000000/i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
