/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Noto Serif KR', 'serif'],
        sans: ['Noto Sans KR', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#faf8f3',
          100: '#f5f0e8',
          200: '#ede3d0',
        },
        stone: {
          warm: '#8c7b6b',
        },
        sage: {
          400: '#8aab8a',
          500: '#6b8f6b',
          600: '#527052',
        },
        rust: {
          400: '#c4785a',
          500: '#a85f42',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      }
    },
  },
  plugins: [],
}
