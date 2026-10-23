/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cocoa: { 950: '#111113' },
        mocha: {
          900: '#1d1c1f',
          800: '#29282b',
          700: '#414145',
          600: '#626267',
        },
        platinum: {
          400: '#F4F4F5',
          500: '#C5C7CB',
        },
        caramel: {
          300: '#E2B886',
          400: '#D99A62',
          500: '#C68B59',
        },
        lavender: {
          100: '#e8f1ff',
          300: '#78aaf2',
          400: '#5593eb',
          500: '#397ddd',
          600: '#326fc5',
          700: '#2b5eaa',
          800: '#244d8b',
          900: '#1c3a66',
        },
        signal: {
          300: '#91d35c',
          400: '#73bd3b',
          500: '#68ad32',
          600: '#568f2b',
        },
      },
    },
  },
  plugins: [],
};
