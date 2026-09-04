/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FAF8F5',
          100: '#F5F0EA',
          200: '#E8DFD3',
          300: '#D4C4B0',
          400: '#B8A088',
          500: '#9C8066',
          600: '#7A6350',
          700: '#5C4A3C',
          800: '#3E3228',
          900: '#201A14',
        },
        brand: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
        },
        status: {
          progress: '#2563EB',
          completed: '#059669',
          cancelled: '#DC2626',
          archived: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
