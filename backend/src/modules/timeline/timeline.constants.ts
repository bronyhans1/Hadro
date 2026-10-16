export const TIMELINE_MODULES = [
  "payroll",
  "attendance",
  "leave",
  "manual_overtime",
  "recruitment",
  "assets",
  "performance",
  "disciplinary",
  "finance",
] as const;

export type TimelineModule = (typeof TIMELINE_MODULES)[number];

export const TIMELINE_LIST_DEFAULT_LIMIT = 50;
export const TIMELINE_LIST_MAX_LIMIT = 200;
