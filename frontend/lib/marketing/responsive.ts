/**
 * Responsive rules for marketing pages (Stage 0 foundation).
 *
 * Breakpoints (Tailwind defaults):
 * - base: mobile-first
 * - sm: 640px — stacked CTAs → row, denser cards
 * - md: 768px — two-column content where appropriate
 * - lg: 1024px — full nav, 12-column hero / showcase grids
 * - xl: 1280px — optional wider mockups only; keep copy measure readable
 *
 * Rules:
 * 1. Mobile-first spacing via --mkt-section-y and --mkt-gutter (fluid).
 * 2. Never shrink tap targets below 44px for primary CTAs.
 * 3. Showcase / hero: single column until lg, then 5/7 or 6/6 split.
 * 4. Industry grids: 1 → 2 (sm) → 3 (md) → 4–5 (lg) columns.
 * 5. Phone mockups stay centered and max-width constrained on all breakpoints.
 * 6. Sticky marketing nav collapses to icon menu below lg.
 * 7. Prefer stacking over horizontal scroll for marketing content.
 */

export const MARKETING_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const MARKETING_RESPONSIVE_NOTES = [
  "Mobile-first fluid section padding and gutters",
  "Primary CTAs remain full-width on small screens, auto-width from sm",
  "Desktop navigation from lg; hamburger below lg",
  "Signature showcases reverse visual/copy only from lg",
  "Industry cards scale 1/2/4 columns across base/sm/lg",
] as const;
