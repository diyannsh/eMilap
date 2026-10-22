/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cocoa: { 950: '#101113' },
        mocha: {
          900: '#191a1d',
          800: '#222428',
          700: '#34363b',
          600: '#4a4d54',
        },
        platinum: {
          400: '#F4F4F5',
          500: '#C5C7CB',
        },
        lavender: {
          100: '#F2F3F4',
          300: '#D8DADE',
          500: '#AEB1B7',
          600: '#8F939B',
          700: '#6F737C',
          800: '#4D5058',
          900: '#32353B',
        },
      },
    },
  },
  plugins: [],
};
