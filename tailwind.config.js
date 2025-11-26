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
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a'
        },
        secondary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b'
        },
        accent: {
          DEFAULT: '#ffffff',
          hover: '#e5e5e5',
          dark: '#171717'
        },
        success: '#ffffff',
        warning: '#d4d4d4',
        danger: '#ffffff',
        rail: {
          light: '#ffffff',
          dark: '#000000',
          gray: '#525252',
          muted: '#a3a3a3'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-up': 'fadeUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'scanner': 'scanner 2s ease-in-out infinite',
        'rail-track': 'railTrack 20s linear infinite',
        'train-move': 'trainMove 8s linear infinite',
        'signal-blink': 'signalBlink 1.5s ease-in-out infinite',
        'sidebar-expand': 'sidebarExpand 0.3s ease-out',
        'sidebar-collapse': 'sidebarCollapse 0.3s ease-in',
        'menu-hover': 'menuHover 0.2s ease-out',
        'data-flow': 'dataFlow 1.5s ease-in-out infinite',
        'progress-bar': 'progressBar 2s ease-out',
        'card-enter': 'cardEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'status-pulse': 'statusPulse 2s ease-in-out infinite'
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 255, 255, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        scanner: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.5' },
          '50%': { transform: 'translateY(100%)', opacity: '1' }
        },
        railTrack: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '100px 0' }
        },
        trainMove: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(calc(100vw + 100%))' }
        },
        signalBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' }
        },
        sidebarExpand: {
          '0%': { width: '64px' },
          '100%': { width: '280px' }
        },
        sidebarCollapse: {
          '0%': { width: '280px' },
          '100%': { width: '64px' }
        },
        menuHover: {
          '0%': { transform: 'translateX(0)', backgroundColor: 'transparent' },
          '100%': { transform: 'translateX(4px)', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
        },
        dataFlow: {
          '0%': { opacity: '0.3', transform: 'scale(0.95)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0.3', transform: 'scale(0.95)' }
        },
        progressBar: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        },
        cardEnter: {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
        },
        statusPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 255, 255, 0)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms'
      },
      boxShadow: {
        'rail': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'rail-lg': '0 8px 40px rgba(0, 0, 0, 0.6)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.1)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.2)'
      }
    },
  },
  plugins: [],
}
