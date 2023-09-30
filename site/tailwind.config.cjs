/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        "my-bg": "#1d2535",
        primary: "#204385",
        secondary: "#a094e5",
        accent: "#42bcd1",
        "accent-2": "#3a49d0",
        "accent-3": "#7bb7df",
      },
    },
  },
  plugins: [],
};
