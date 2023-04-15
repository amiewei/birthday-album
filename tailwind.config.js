module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f4f6fa",
          100: "#dfe4f1",
          200: "#bcc3dd",
          300: "#99a2c9",
          400: "#7d86b9",
          500: "#6470a3",
          600: "#4c5a8b",
          700: "#354372",
          800: "#1d2c5a",
          900: "#030f41",
        },
        secondary: {
          50: "#fdf7e6",
          100: "#fbecc1",
          200: "#f9e19b",
          300: "#f7d675",
          400: "#f5cb50",
          500: "#e0b23b",
          600: "#b18e30",
          700: "#806b25",
          800: "#51371b",
          900: "#210c10",
        },
      },
    },

    fontFamily: {
      display: ["Great Vibes", "cursive"],
    },
  },
  plugins: [require("@tailwindcss/forms"), require("flowbite/plugin")],
};
