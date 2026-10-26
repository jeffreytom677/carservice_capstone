import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Design tokens (ServiceBook black theme) ──────────────────────────────
      colors: {
        // Backgrounds
        background: '#0A0A0B',
        surface: '#111113',
        elevated: '#18181B',
        // Borders
        border: '#27272A',
        // Text
        'text-primary': '#FAFAFA',
        'text-secondary': '#A1A1AA',
        'text-muted': '#71717A',
        // Accent — amber
        accent: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          muted: '#78350F',
        },
        // Status colours (badges, charts only)
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      // ── Typography ────────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['26px', { lineHeight: '1.2', fontWeight: '600' }],
        'section-title': ['17px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.5' }],
        caption: ['12px', { lineHeight: '1.4' }],
      },
      // ── Border radius ─────────────────────────────────────────────────────────
      borderRadius: {
        card: '12px',
        input: '8px',
        button: '8px',
        badge: '6px',
      },
      // ── Box shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        elevated: '0 4px 16px 0 rgba(0,0,0,0.5)',
        input: '0 0 0 2px #F59E0B',
      },
      // ── Transitions ───────────────────────────────────────────────────────────
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
      },
      // ── Grid / spacing ────────────────────────────────────────────────────────
      spacing: {
        sidebar: '240px',
      },
    },
  },
  plugins: [
    // @tailwindcss/forms resets form element styles for easier customisation
    forms,
  ],
};
