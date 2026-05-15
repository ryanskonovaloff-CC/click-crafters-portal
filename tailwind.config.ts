import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#070707",
        panel: "rgba(255,255,255,0.055)",
        panelStrong: "rgba(255,255,255,0.09)",
        border: "rgba(255,255,255,0.12)",
        accent: "#ff6a1a",
        accentSoft: "rgba(255,106,26,0.14)",
        muted: "rgba(255,255,255,0.64)"
      },
      borderRadius: {
        xl: "8px",
        "2xl": "12px"
      },
      boxShadow: {
        glow: "0 18px 70px rgba(255, 106, 26, 0.12)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
