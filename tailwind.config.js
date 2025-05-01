/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        discord: {
          primary: "#36393f",
          secondary: "#2f3136",
          tertiary: "#202225",
          accent: "#5865f2",
          textPrimary: "#dcddde",
          textSecondary: "#96989d",
          textMuted: "#72767d",
          success: "#3ba55c",
          danger: "#ed4245",
          warning: "#faa61a",
        },
      },
    },
  },
  plugins: [],
};
