/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          950: "#050508",
          900: "#0a0c12",
          800: "#12151f",
          700: "#1a1e2b",
          600: "#232838",
        },
        accent: {
          mint: "#34d399",
          sky: "#38bdf8",
          violet: "#a78bfa",
          rose: "#fb7185",
          amber: "#fbbf24",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        mesh:
          "linear-gradient(135deg, rgba(56,189,248,0.12), rgba(167,139,250,0.08), rgba(52,211,153,0.1))",
      },
      boxShadow: {
        glass: "0 4px 24px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
      },
    },
  },
  plugins: [],
};
