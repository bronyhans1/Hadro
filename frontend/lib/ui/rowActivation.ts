const INTERACTIVE_ROW_TARGET = "button,a,input,select,textarea,[data-row-control]";

/** True when a row click should open the record. Controls opt out via data-row-control. */
export function rowClickShouldOpen(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== "function") return true;
  return !(target as Element).closest(INTERACTIVE_ROW_TARGET);
}
