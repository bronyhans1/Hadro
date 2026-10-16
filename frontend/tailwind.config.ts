import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      transitionDuration: {
        DEFAULT: "180ms",
        fast: "120ms",
        slow: "280ms",
      },
      colors: {
        primary: {
          50: "#fff8eb",
          100: "#ffefcc",
          500: "#f4a300",
          600: "#d48f00",
          700: "#b87a00",
        },
        ds: {
          primary: "var(--ds-color-primary)",
          "primary-hover": "var(--ds-color-primary-hover)",
          success: "var(--ds-color-success)",
          warning: "var(--ds-color-warning)",
          danger: "var(--ds-color-danger)",
          info: "var(--ds-color-info)",
          background: "var(--ds-color-background)",
          surface: "var(--ds-color-surface)",
          elevated: "var(--ds-color-surface-elevated)",
          muted: "var(--ds-color-text-muted)",
        },
      },
      borderRadius: {
        ds: "var(--ds-radius-md)",
        "ds-lg": "var(--ds-radius-lg)",
        "ds-xl": "var(--ds-radius-xl)",
      },
      boxShadow: {
        card: "var(--ds-shadow-card)",
        hover: "var(--ds-shadow-hover)",
        dropdown: "var(--ds-shadow-dropdown)",
        modal: "var(--ds-shadow-modal)",
        floating: "var(--ds-shadow-floating)",
      },
      spacing: {
        "ds-1": "var(--ds-space-1)",
        "ds-2": "var(--ds-space-2)",
        "ds-3": "var(--ds-space-3)",
        "ds-4": "var(--ds-space-4)",
        "ds-6": "var(--ds-space-6)",
        "ds-8": "var(--ds-space-8)",
      },
    },
  },
  plugins: [],
};

export default config;
