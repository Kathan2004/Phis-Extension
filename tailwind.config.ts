import type { Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        noir: {
          950: "#06090d",
          900: "#0b1117",
          800: "#131f29"
        },
        cyan: {
          400: "#35d4ff",
          500: "#0bb3e5"
        },
        amber: {
          400: "#ffc14a"
        },
        red: {
          500: "#ff5f57"
        }
      },
      fontFamily: {
        display: ["Space Grotesk", "Segoe UI", "sans-serif"],
        body: ["Plus Jakarta Sans", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        glass: "0 12px 40px rgba(0, 0, 0, 0.45)"
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "0.9" },
          "70%": { transform: "scale(1.05)", opacity: "0.3" },
          "100%": { transform: "scale(0.95)", opacity: "0.9" }
        },
        slideIn: {
          "0%": { transform: "translateY(14px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      },
      animation: {
        pulseRing: "pulseRing 1.8s ease-in-out infinite",
        slideIn: "slideIn 280ms ease-out"
      }
    }
  },
  plugins: []
} satisfies Config
