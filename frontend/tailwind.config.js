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
        navy: {
          950: '#0a0f1d',
          900: '#101B2D', // Primary background: Midnight Navy
          800: '#142236',
          700: '#18283D', // Secondary background: Slate Blue
          600: '#233752',
          500: '#324a6d',
        },
        cyan: {
          DEFAULT: '#00C2D1', // Primary accent: Electric Cyan
          glow: 'rgba(0, 194, 209, 0.4)',
          50: '#e6fcff',
          100: '#ccf8ff',
          400: '#22d3ee',
          500: '#00C2D1',
          600: '#009ea8',
        },
        warning: {
          DEFAULT: '#F59E0B', // Safety Orange
          glow: 'rgba(245, 158, 11, 0.35)',
        },
        critical: {
          DEFAULT: '#EF4444', // Alert Red
          glow: 'rgba(239, 68, 68, 0.35)',
        },
        healthy: {
          DEFAULT: '#22C55E', // Signal Green
          glow: 'rgba(34, 197, 94, 0.35)',
        },
        soft: {
          white: '#F1F5F9', // Soft White text
          muted: '#94A3B8',
          subtle: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 15px -3px rgba(0, 194, 209, 0.35)',
        'cyan-glow-lg': '0 0 25px -2px rgba(0, 194, 209, 0.5)',
        'red-glow': '0 0 15px -3px rgba(239, 68, 68, 0.35)',
        'orange-glow': '0 0 15px -3px rgba(245, 158, 11, 0.35)',
        'green-glow': '0 0 15px -3px rgba(34, 197, 94, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
    },
  },
  plugins: [],
};
