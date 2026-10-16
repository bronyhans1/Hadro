/**
 * Shared semantic tone styles for dashboard tiles / StatCard icons.
 * Uses design tokens only — no Tailwind palette colors.
 */
export type StatusTone =
  | "success"
  | "primary"
  | "warning"
  | "danger"
  | "info"
  | "violet"
  | "pink"
  | "orange"
  | "neutral";

export type ToneStyle = {
  borderColor: string;
  background: string;
  color: string;
};

export const STATUS_TONE_STYLES: Record<StatusTone, ToneStyle> = {
  success: {
    borderColor: "var(--ds-color-success-border)",
    background: "var(--ds-color-success-subtle)",
    color: "var(--ds-color-success-text)",
  },
  primary: {
    borderColor: "color-mix(in srgb, var(--ds-color-primary) 28%, transparent)",
    background: "var(--ds-color-primary-subtle)",
    color: "var(--ds-color-primary)",
  },
  warning: {
    borderColor: "var(--ds-color-warning-border)",
    background: "var(--ds-color-warning-subtle)",
    color: "var(--ds-color-warning-text)",
  },
  danger: {
    borderColor: "var(--ds-color-danger-border)",
    background: "var(--ds-color-danger-subtle)",
    color: "var(--ds-color-danger-text)",
  },
  info: {
    borderColor: "var(--ds-color-info-border)",
    background: "var(--ds-color-info-subtle)",
    color: "var(--ds-color-info-text)",
  },
  violet: {
    borderColor: "var(--ds-color-accent-violet-border)",
    background: "var(--ds-color-accent-violet-subtle)",
    color: "var(--ds-color-accent-violet-text)",
  },
  pink: {
    borderColor: "var(--ds-color-accent-pink-border)",
    background: "var(--ds-color-accent-pink-subtle)",
    color: "var(--ds-color-accent-pink-text)",
  },
  orange: {
    borderColor: "var(--ds-color-accent-orange-border)",
    background: "var(--ds-color-accent-orange-subtle)",
    color: "var(--ds-color-accent-orange-text)",
  },
  neutral: {
    borderColor: "var(--ds-color-border)",
    background: "var(--ds-color-surface-muted)",
    color: "var(--ds-color-text-secondary)",
  },
};
