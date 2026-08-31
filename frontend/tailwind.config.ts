import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Design system: Deep Dark Slate Blue base, Electric Blue primary,
        // Neon Emerald secondary/success, Crimson Red danger.
        base: {
          DEFAULT: "#0B0F17",
          soft: "#0F1520",
          raised: "#131A26",
        },
        glass: "#1E293B",
        accent: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3B82F6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          300: "#fca5a5",
          400: "#f87171",
          500: "#EF4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0,0,0,0.45)",
        "glow-blue": "0 0 0 1px rgba(59,130,246,0.25), 0 0 40px -8px rgba(59,130,246,0.55)",
        "glow-emerald": "0 0 0 1px rgba(16,185,129,0.25), 0 0 40px -8px rgba(16,185,129,0.55)",
        "glow-red": "0 0 0 1px rgba(239,68,68,0.25), 0 0 40px -8px rgba(239,68,68,0.5)",
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "16px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.18), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
