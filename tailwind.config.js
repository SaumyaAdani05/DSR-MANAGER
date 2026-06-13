/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        adani: {
          navy: '#003087',
          navyDark: '#001f5b',
          navyLight: '#0041b3',
          red: '#E2231A',
          redDark: '#b51813',
          white: '#FFFFFF',
          lightGray: '#F4F5F7',
          gray: '#6B7280',
          border: '#D1D5DB',
        },
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
        greyedOut: '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 48, 135, 0.12)',
        'card-hover': '0 4px 16px rgba(0, 48, 135, 0.18)',
        glow: '0 0 20px rgba(0, 48, 135, 0.15)',
      },
      animation: {
        'modal-in': 'modalIn 200ms ease-out',
        'slide-in': 'slideIn 250ms ease-out',
        'slide-out': 'slideOut 250ms ease-in',
        'shake': 'shake 300ms ease-in-out',
        'toast-in': 'toastIn 250ms ease-out',
        'toast-out': 'toastOut 200ms ease-in',
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-in-up': 'fadeInUp 300ms ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'check-in': 'checkIn 400ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
      },
      keyframes: {
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        toastOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-16px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.3)' },
        },
        checkIn: {
          '0%': { opacity: '0', transform: 'scale(0) rotate(-45deg)' },
          '60%': { opacity: '1', transform: 'scale(1.1) rotate(0deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
