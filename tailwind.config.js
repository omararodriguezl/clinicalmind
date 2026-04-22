/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mapped to CSS variables — light/dark via .dark class
        background:    'var(--cm-bg)',
        surface:       'var(--cm-surface)',
        'surface-2':   'var(--cm-surface-alt)',
        'surface-3':   'var(--cm-surface-deep)',
        border:        'var(--cm-line)',
        'border-light':'var(--cm-line-soft)',

        // Primary = OD green (military)
        primary: {
          DEFAULT: 'var(--cm-od)',
          muted:   'var(--cm-od-soft)',
          ink:     'var(--cm-od-ink)',
        },

        // Army mode — OD green family
        army: {
          DEFAULT: 'var(--cm-od)',
          muted:   'var(--cm-od-soft)',
          bg:      'var(--cm-od-soft)',
          border:  'var(--cm-od)',
          text:    'var(--cm-od-ink)',
        },

        // Civilian mode — navy family
        civilian: {
          DEFAULT: 'var(--cm-navy)',
          muted:   'var(--cm-navy-soft)',
          bg:      'var(--cm-navy-soft)',
          border:  'var(--cm-navy)',
          text:    'var(--cm-navy-ink)',
        },

        // Status
        danger:           'var(--cm-danger)',
        'danger-muted':   'var(--cm-danger-soft)',
        warning:          'var(--cm-warn)',
        'warning-muted':  'var(--cm-warn-soft)',
        success:          '#2D7A4F',
        'success-muted':  '#C8E6D4',

        // Text hierarchy
        'text-primary':   'var(--cm-ink)',
        'text-secondary': 'var(--cm-ink-soft)',
        'text-muted':     'var(--cm-ink-mute)',
        'text-disabled':  'var(--cm-ink-faint)',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm:      '2px',
        md:      '2px',
        lg:      '3px',
        xl:      '4px',
        '2xl':   '4px',
        full:    '9999px',
      },
      boxShadow: {
        card:  '0 1px 2px rgba(0,0,0,0.06)',
        modal: '0 8px 32px rgba(0,0,0,0.18)',
        glow:  'none',
        'glow-army':     'none',
        'glow-civilian': 'none',
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.15s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
        'cm-pulse':   'cmPulse 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        cmPulse: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
}
