/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {

    extend: {
      colors: {
       
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
     
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    require('@tailwindcss/typography'),
    // ...
  ],
}
