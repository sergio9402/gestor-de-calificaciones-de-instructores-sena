/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sena: {
          green: {
            DEFAULT: '#39A900',
            dark: '#2d8400',
            light: '#eaf7e3',
            50: '#f2fbf0',
            100: '#e1f7dc',
            500: '#39a900',
            600: '#2f8f00',
            700: '#267300',
            800: '#1d5700',
          },
          navy: {
            DEFAULT: '#00324D',
            light: '#0a496d',
            dark: '#002133',
          },
          gray: {
            bg: '#F8FAFC',
            surface: '#FFFFFF',
            border: '#E2E8F0',
            text: '#1E293B',
            muted: '#64748B'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

