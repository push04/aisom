/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#1F2933',
          950: '#0F172A'
        },
        secondary: {
          50: '#F7F9FA',
          100: '#E4E9ED',
          200: '#C5D1DA',
          300: '#9AA5B1',
          400: '#7B8794',
          500: '#616E7C',
          600: '#52606D',
          700: '#3E4C59',
          800: '#323F4B',
          900: '#1F2933'
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8'
        },
        success: '#22A779',
        warning: '#E0B400',
        danger: '#D64545'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
