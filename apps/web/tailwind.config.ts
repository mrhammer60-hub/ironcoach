import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ["11px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "20px" }],
        base: ["15px", { lineHeight: "24px" }],
        lg: ["17px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "30px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "40px" }],
        "4xl": ["36px", { lineHeight: "44px" }],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.2)",
        sm: "0 2px 8px rgba(0,0,0,0.25)",
        md: "0 4px 16px rgba(0,0,0,0.3)",
        lg: "0 8px 32px rgba(0,0,0,0.4)",
        focus: "0 0 0 3px rgba(200,241,53,0.2)",
      },
      transitionDuration: {
        fast: "100ms",
        base: "200ms",
        slow: "300ms",
      },
    },
  },
  plugins: [],
};

export default config;
