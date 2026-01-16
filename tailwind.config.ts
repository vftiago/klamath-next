import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [],
  theme: {
    extend: {
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        "barlow": ["var(--font-barlow-condensed)"],
        "electrolize": ["var(--font-electrolize)"],
        "roboto-condensed": ["var(--font-roboto-condensed)"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
} satisfies Config;
