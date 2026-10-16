/** Empty custom-select value clears the assignment. Non-empty values are shift ids. */
export function shiftIdFromSelectValue(value: string): string | null {
  return value ? value : null;
}
