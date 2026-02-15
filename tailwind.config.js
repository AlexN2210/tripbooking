/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FFFBF2',
          100: '#FFF3D6',
          200: '#FFE5AD',
          300: '#FFD283',
          400: '#F5BC57',
          500: '#E6A83C',
          600: '#C98C2F',
          700: '#A06D25',
          800: '#6F4C1A',
          900: '#3E2A0F',
        },
        palm: {
          50: '#F0FBF6',
          100: '#D6F5E5',
          200: '#AEEACD',
          300: '#7EDDB0',
          400: '#49C991',
          500: '#26A56F',
          600: '#1C8458',
          700: '#176947',
          800: '#13523A',
          900: '#0F3D2C',
        },
        lagoon: {
          50: '#EDFCFF',
          100: '#D2F6FF',
          200: '#A4ECFF',
          300: '#6FDDFF',
          400: '#2FC5FF',
          500: '#009EE6',
          600: '#007DB8',
          700: '#00638F',
          800: '#004A6B',
          900: '#00324A',
        },
      },
    },
  },
  plugins: [],
};
