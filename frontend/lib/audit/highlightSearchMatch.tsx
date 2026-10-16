import type { ReactNode } from "react";
import { createElement } from "react";

/**
 * Highlight case-insensitive occurrences of `query` within `text`.
 * Returns plain text when query is empty or there is no match.
 */
export function highlightSearchMatch(text: string, query: string): ReactNode {
  const value = text ?? "";
  const q = query.trim();
  if (!q || !value) return value;

  const lowerValue = value.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = lowerValue.indexOf(lowerQuery, cursor);
  let key = 0;

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push(value.slice(cursor, matchIndex));
    }
    const end = matchIndex + q.length;
    parts.push(
      createElement(
        "mark",
        {
          key: `h-${key++}`,
          className: "rounded-sm px-0.5",
          style: {
            background: "var(--ds-color-primary-muted, rgba(37, 99, 235, 0.18))",
            color: "inherit",
          },
        },
        value.slice(matchIndex, end)
      )
    );
    cursor = end;
    matchIndex = lowerValue.indexOf(lowerQuery, cursor);
  }

  if (parts.length === 0) return value;
  if (cursor < value.length) parts.push(value.slice(cursor));
  return parts;
}
