import type { Config } from "tailwindcss";

const config: Config = {
  // ИСПРАВЛЕНИЕ 1: Используйте строку "class" вместо массива ["class"]
  darkMode: "class", 
  
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    // ИСПРАВЛЕНИЕ 2: Убран лишний пробел после "**/*."
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}", 
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict monochrome palette
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#18181b", // slate-900
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f8fafc", // slate-50
          foreground: "#0f172a", // slate-900
        },
        destructive: {
          DEFAULT: "#dc2626", // red-600
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f1f5f9", // slate-100
          foreground: "#64748b", // slate-500
        },
        accent: {
          DEFAULT: "#f1f5f9", // slate-100
          foreground: "#0f172a", // slate-900
        },
        border: "#e2e8f0", // slate-200
        input: "#e2e8f0", // slate-200
        ring: "#94a3b8", // slate-400
      },
      borderRadius: {
        lg: "0.5rem", // 8px
        md: "0.375rem", // 6px
        sm: "0.25rem", // 4px
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.5rem" }], // Slightly smaller base
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        none: "none",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;