import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.{tsx,ts,jsx,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", ...fontFamily.sans],
        display: ["var(--font-sans)", "Inter", ...fontFamily.sans],
        mono: ["JetBrains Mono", "ui-monospace", ...fontFamily.mono],
      },
      colors: {
        // LeaseAI PRD Design System
        "lease-navy": "#1a2332",
        "lease-orange": "#ff6b35",
        "lease-success": "#2d5a3d",
        "lease-warning": "#f59e0b",
        "lease-danger": "#dc2626",
        "lease-gray": "#6b7280",
        // Finwise landing (src/components/landing)
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        "primary-accent": "var(--primary-accent)",
        "foreground-accent": "var(--foreground-accent)",
        "hero-background": "var(--hero-background)",
      },
      borderRadius: {
        "prd": "8px",
      },
      boxShadow: {
        "prd-card": "0 4px 6px rgba(0, 0, 0, 0.1)",
      },
      screens: {
        "xs": "475px",
      },
    },
  },
  plugins: [],
  darkMode: ['class', '[data-theme="dark"]'],
} satisfies Config;


