/**
 * HADRO Design System — TypeScript token references.
 * Mirrors CSS custom properties in styles/design-tokens.css
 */

export const colors = {
  primary: "var(--ds-color-primary)",
  primaryHover: "var(--ds-color-primary-hover)",
  primaryActive: "var(--ds-color-primary-active)",
  success: "var(--ds-color-success)",
  warning: "var(--ds-color-warning)",
  danger: "var(--ds-color-danger)",
  info: "var(--ds-color-info)",
  background: "var(--ds-color-background)",
  surface: "var(--ds-color-surface)",
  surfaceMuted: "var(--ds-color-surface-muted)",
  surfaceElevated: "var(--ds-color-surface-elevated)",
  card: "var(--ds-color-card)",
  border: "var(--ds-color-border)",
  textPrimary: "var(--ds-color-text-primary)",
  textSecondary: "var(--ds-color-text-secondary)",
  textMuted: "var(--ds-color-text-muted)",
} as const;

export const spacing = {
  1: "var(--ds-space-1)",
  2: "var(--ds-space-2)",
  3: "var(--ds-space-3)",
  4: "var(--ds-space-4)",
  5: "var(--ds-space-5)",
  6: "var(--ds-space-6)",
  8: "var(--ds-space-8)",
  10: "var(--ds-space-10)",
  12: "var(--ds-space-12)",
  16: "var(--ds-space-16)",
} as const;

export const radius = {
  sm: "var(--ds-radius-sm)",
  md: "var(--ds-radius-md)",
  lg: "var(--ds-radius-lg)",
  xl: "var(--ds-radius-xl)",
  full: "var(--ds-radius-full)",
} as const;

export const shadow = {
  card: "var(--ds-shadow-card)",
  hover: "var(--ds-shadow-hover)",
  dropdown: "var(--ds-shadow-dropdown)",
  modal: "var(--ds-shadow-modal)",
  floating: "var(--ds-shadow-floating)",
} as const;

export const duration = {
  fast: "var(--ds-duration-fast)",
  normal: "var(--ds-duration-normal)",
  slow: "var(--ds-duration-slow)",
} as const;

export const typography = {
  display: "ds-display",
  h1: "ds-h1",
  h2: "ds-h2",
  h3: "ds-h3",
  body: "ds-body",
  bodySm: "ds-body-sm",
  caption: "ds-caption",
  label: "ds-label",
} as const;

export const controlHeight = {
  sm: "var(--ds-control-height-sm)",
  md: "var(--ds-control-height-md)",
  lg: "var(--ds-control-height-lg)",
} as const;
