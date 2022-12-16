/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    fontSize: {
      xs: [
        '0.75rem',
        {
          lineHeight: '1rem',
        },
      ],
      sm: [
        '0.875rem',
        {
          lineHeight: '1.5rem',
        },
      ],
      base: [
        '1rem',
        {
          lineHeight: '1.75rem',
        },
      ],
      lg: [
        '1.125rem',
        {
          lineHeight: '2rem',
        },
      ],
      xl: [
        '1.25rem',
        {
          lineHeight: '2rem',
        },
      ],
      '2xl': [
        '1.5rem',
        {
          lineHeight: '2rem',
        },
      ],
      '3xl': [
        '2rem',
        {
          lineHeight: '2.5rem',
        },
      ],
      '4xl': [
        '2.5rem',
        {
          lineHeight: '3.5rem',
        },
      ],
      '5xl': [
        '3rem',
        {
          lineHeight: '3.5rem',
        },
      ],
      '6xl': [
        '3.75rem',
        {
          lineHeight: '1',
        },
      ],
      '7xl': [
        '4.5rem',
        {
          lineHeight: '1.1',
        },
      ],
      '8xl': [
        '6rem',
        {
          lineHeight: '1',
        },
      ],
      '9xl': [
        '8rem',
        {
          lineHeight: '1',
        },
      ],
    },
    extend: {

      textShadow: {
        largeShadow: '0 192px 136px rgba(26,43,59,0.23),0 70px 50px rgba(26,43,59,0.16),0 34px 24px rgba(26,43,59,0.13),0 17px 12px rgba(26,43,59,0.1),0 7px 5px rgba(26,43,59,0.07);',
      },
      boxShadow: {
        DEFAULT: '0 2px 6px -1px rgba(0, 0, 0, 0.16), 0 1px 4px -1px rgba(0, 0, 0, 0.04);',
        active: '0 0 8px -2px rgba(0, 0, 0, 0.1), 0 6px 20px -3px rgba(0, 0, 0, 0.2);',
        card: '0 50px 60px rgb(12 25 39 / 10%), 0 16px 20px rgb(12 25 39 / 6%), 0 6px 8px rgb(12 25 39 / 5%)',
        largeShadow: '0 192px 136px rgba(26,43,59,0.23),0 70px 50px rgba(26,43,59,0.16),0 34px 24px rgba(26,43,59,0.13),0 17px 12px rgba(26,43,59,0.1),0 7px 5px rgba(26,43,59,0.07);',
      },
      colors: {
        black: '#111213',
        mint: '#32d9e1',
        lime: '#df3',
        orange: '#fa6d3e',
        blue: '#3bf',
        azure: '#4E81B1',
        mercury: '#e1e5e9',
        gray: '#667380',
        tangaroa: {
          50: '#E3EBF3',
          100: '#C3D4E4',
          200: '#8AACCC',
          300: '#4E81B1',
          400: '#335575',
          500: '#1A2B3B',
          600: '#14222E',
          700: '#101A23',
          800: '#0B1219',
          900: '#05080B',
        },
        mercury: {
          50: "#f5f7f9",
          100: "#f8f9fc",
          200: "#f1f3f9",
          300: "#dee3ed",
          400: "#c2c9d6",
          500: "#8f96a3",
          600: "#5e636e",
          700: "#2f3237",
          800: "#1d1e20",
          900: "#111213"
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
        '6xl': '5rem',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
       
        mono: ['IBM Plex Mono', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    require('tailwindcss-textshadow'),
    require('@tailwindcss/typography'),
    // ...
  ],
}
