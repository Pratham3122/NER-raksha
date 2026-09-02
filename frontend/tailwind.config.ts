import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // NER-RAKSHA Design System
        brand: {
          bg: '#0F172A',       // Main background
          surface: '#1E293B',  // Card/panel surface
          border: '#334155',   // Borders
          muted: '#475569',    // Muted text
          text: '#F8FAFC',     // Primary text
          sub: '#94A3B8',      // Secondary text
        },
        status: {
          open: '#15803D',      // OPEN - green
          atrisk: '#D97706',    // AT_RISK - amber
          disrupted: '#EA580C', // SEVERELY_DISRUPTED - orange
          blocked: '#DC2626',   // BLOCKED - red
          unknown: '#475569',   // UNKNOWN - slate
        },
        risk: {
          low: '#15803D',
          medium: '#D97706',
          high: '#EA580C',
          critical: '#DC2626',
        },
        accent: '#2563EB',      // Blue accent
        danger: '#DC2626',      // Danger red
        warning: '#D97706',     // Warning amber
        success: '#15803D',     // Success green
        info: '#2563EB',        // Info blue
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
    },
  },
  plugins: [],
} satisfies Config
