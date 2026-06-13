/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mh: {
          bg:             '#FFFFFF',
          surface:        '#F9FAFB',
          surface2:       '#F3F4F6',
          border:         '#E5E7EB',
          'border-dark':  '#D1D5DB',
          text:           '#111827',
          text2:          '#6B7280',
          text3:          '#9CA3AF',
          accent:         '#F97316',
          'accent-hover': '#EA6C0A',
          'accent-light': '#FFF7ED',
          success:        '#10B981',
          'success-light':'#ECFDF5',
          danger:         '#EF4444',
          'danger-light': '#FEF2F2',
          warning:        '#F59E0B',
          'warning-light':'#FFFBEB',
          info:           '#3B82F6',
          'info-light':   '#EFF6FF',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card:        '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-lg':   '0 4px 12px rgba(0,0,0,0.08)',
        modal:       '0 20px 60px rgba(0,0,0,0.14)',
        'inner-sm':  'inset 0 1px 2px rgba(0,0,0,0.05)',
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-fast': 'pulse 1s ease-in-out infinite',
        'fade-up':    'fadeUp 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
