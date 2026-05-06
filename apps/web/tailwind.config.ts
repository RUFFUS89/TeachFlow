import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta TeachFlow — extraída dos mockups
        // Background / superfícies
        bg: "#FAF7F1",
        bgAlt: "#F2EDE3",
        surface: "#FFFFFF",
        surface2: "#F5F1E8",
        surfaceSunken: "#EBE5D7",
        // Texto
        ink: "#3D3D3A",
        inkSoft: "#5A5752",
        inkMuted: "#8A8680",
        // Tons quentes
        peach: "#F4D6BC",
        peachInk: "#7A4423",
        sage: "#CFE0CB",
        sageInk: "#3F5A3B",
        caramel: "#E8C9A0",
        caramelInk: "#7A4F1F",
        butter: "#F5E5A8",
        butterInk: "#7A6314",
        blush: "#F2C5C0",
        blushInk: "#7A2D27",
        lilac: "#D8C9E8",
        lilacInk: "#5A3F7A",
        accent: "#F4C9B8",
        accentInk: "#7A3520",
        // Borders
        border: "#E8E2D5",
        borderSoft: "#EFEBE0",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        chip: "10px",
        card: "14px",
        field: "10px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
