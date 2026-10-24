/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cocoa: { 950: '#0E0805' },
        mocha: {
          950: '#0E0805',
          900: '#1A100C',
          800: '#261812',
          700: '#3D261D',
          600: '#543629',
          500: '#6F4E37',
        },
        platinum: {
          300: '#FFFFFF',
          400: '#FAF9F8',
          500: '#E5E4E2',
          600: '#C2BBB2',
        },
        caramel: {
          300: '#F2D3A8',
          400: '#E0AA6F',
          500: '#C68B59',
        },
        lavender: {
          100: '#FAF8FC',
          200: '#F2EEF8',
          300: '#E6E0F0',
          400: '#D5CBE4',
          500: '#B8A8D0',
          600: '#9480B2',
          700: '#7B679B',
          800: '#5F4D7A',
          900: '#3A2C4F',
        },
        signal: {
          300: '#F5B82E',
          400: '#EAAA00',
          500: '#C68B59',
          600: '#A36F45',
        },
      },
    },
  },
  plugins: [],
};
