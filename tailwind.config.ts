import type { Config } from 'tailwindcss';

// A real, considered token set — not Tailwind's default gray/blue. One accent color (indigo),
// a neutral scale with a slight cool tint (reads as "software", not "paper"), and a genuine
// type scale with tightened tracking on headings.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          1: '#0B0D12',
          2: '#20242E',
          3: '#4A5062',
          4: '#8890A2',
        },
        line: {
          DEFAULT: '#E4E6EC',
          soft: '#EEF0F4',
          strong: '#D3D7E0',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunk: '#F7F8FA',
          raised: '#FFFFFF',
        },
        accent: {
          50: '#F0F1FE',
          100: '#E1E3FD',
          200: '#C3C7FC',
          300: '#9CA1F8',
          400: '#7A7FF2',
          500: '#5457E5',
          600: '#4340CC',
          700: '#3630A3',
          800: '#2B2782',
          900: '#211E63',
        },
        green: { 50: '#EFFAF3', 500: '#1D9A5E', 600: '#167C4B' },
        amber: { 50: '#FFF8EB', 500: '#B4780A', 600: '#946107' },
        red: { 50: '#FEF1F1', 500: '#C5322A', 600: '#A32620' },
      },
      fontFamily: {
        sans: [
          'InterVariable', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto',
          'Helvetica Neue', 'Arial', 'sans-serif',
        ],
        mono: [
          'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        xs: ['0.75rem', { lineHeight: '1.1rem', letterSpacing: '0.005em' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.4rem' }],
        md: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.5rem', letterSpacing: '-0.005em' }],
        xl: ['1.25rem', { lineHeight: '1.6rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.625rem', { lineHeight: '1.9rem', letterSpacing: '-0.015em' }],
        '3xl': ['2.0625rem', { lineHeight: '2.3rem', letterSpacing: '-0.02em' }],
      },
      spacing: {
        4.5: '1.125rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
      },
      borderRadius: {
        sm: '5px',
        DEFAULT: '7px',
        md: '9px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(11 13 18 / 0.04)',
        sm: '0 1px 3px 0 rgb(11 13 18 / 0.06), 0 1px 2px -1px rgb(11 13 18 / 0.04)',
        md: '0 4px 12px -2px rgb(11 13 18 / 0.08), 0 2px 4px -2px rgb(11 13 18 / 0.04)',
        popover: '0 8px 24px -4px rgb(11 13 18 / 0.12), 0 2px 8px -2px rgb(11 13 18 / 0.06)',
        focus: '0 0 0 3px rgb(84 87 229 / 0.16)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(-6px) scale(0.98)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fade-in 120ms ease-out',
        'slide-up': 'slide-up 160ms cubic-bezier(0.16,1,0.3,1)',
        'toast-in': 'toast-in 200ms cubic-bezier(0.16,1,0.3,1)',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
