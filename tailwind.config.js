/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D2240',
          900: '#091a33',
          800: '#122b50',
          700: '#16335c',
          600: '#1d3f6e',
        },
        gold: {
          DEFAULT: '#F5C842',
          dk: '#e0b32f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
