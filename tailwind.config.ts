import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        surface: "var(--bg-surface)",
        ink: "var(--color-ink)",
        muted: "var(--text-muted)",
        line: "var(--border-default)",
        action: "var(--accent-action)",
        save: "var(--accent-save)",
        role: "var(--accent-role)",
        drill: "var(--accent-drill)",
        risk: "var(--accent-risk)"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-ui)"],
        mono: ["var(--font-mono)"]
      },
      lineHeight: {
        tight: "var(--leading-tight)",
        heading: "var(--leading-heading)",
        body: "var(--leading-body)"
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)"
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        float: "var(--shadow-float)"
      },
      maxWidth: {
        content: "var(--layout-content-max)",
        report: "var(--layout-report-max)",
        landing: "var(--layout-landing-max)",
        readable: "var(--measure-readable)"
      },
      transitionDuration: {
        fast: "var(--motion-fast)",
        base: "var(--motion-base)",
        slow: "var(--motion-slow)"
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        enter: "var(--ease-enter)"
      }
    }
  },
  plugins: []
};

export default config;
