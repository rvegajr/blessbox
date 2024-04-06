/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {

    extend: {
      colors: {
        purple: {
          50: "#E6E7F4",
      100: "#D1D3EB",
      200: "#9FA4D5",
      300: "#7178C1",
      400: "#474FA3",
      500: "#333875",
      600: "#282D5C",
      700: "#1F2247",
      800: "#14162E",
      900: "#0B0C19"
        },
        blue: {
         50: "#EBF2FE",
      100: "#D7E4FE",
      200: "#AFC9FD",
      300: "#8DB2FC",
      400: "#6597FB",
      500: "#3D7BFA",
      600: "#0655F4",
      700: "#0540B8",
      800: "#032A77",
      900: "#02153C"
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
        '6xl': '5rem',
      },
      fontFamily: {
        display: ['Cabinet Grotesk', ...defaultTheme.fontFamily.sans],
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],

      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    require('@tailwindcss/typography'),
    // ...
  ],
}
