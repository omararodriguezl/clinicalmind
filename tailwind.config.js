/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base dark palette
        background: '#0a0c10',
        surface: '#111318',
        'surface-2': '#1a1d24',
        'surface-3': '#222630',
        border: '#2a2f3d',
        'border-light': '#363c4e',

        // Primary accent — clinical blue
        primary: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // Army accent — military olive/green
        army: {
          DEFAULT: '#4ade80',
          muted: '#166534',
          bg: '#0d1f12',
          border: '#166534',
          text: '#86efac',
        },

        // Civilian accent — calming teal
        civilian: {
          DEFAULT: '#22d3ee',
          muted: '#164e63',
          bg: '#0c1f26',
          border: '#155e75',
          text: '#67e8f9',
        },

        // Status
        danger: '#ef4444',
        'danger-muted': '#7f1d1d',
        warning: '#f59e0b',
        'warning-muted': '#78350f',
        success: '#10b981',
        'success-muted': '#064e3b',

        // Text hierarchy
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#475569',
        'text-disabled': '#2d3748',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        modal: '0 20px 60px rgba(0,0,0,0.7)',
        glow: '0 0 20px rgba(59,130,246,0.3)',
        'glow-army': '0 0 20px rgba(74,222,128,0.2)',
        'glow-civilian': '0 0 20px rgba(34,211,238,0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
