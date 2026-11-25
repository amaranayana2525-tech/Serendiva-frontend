import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

/**
 * Design tokens copied verbatim from the Stitch export (`serendiva_sri_lanka_tours_home_desktop/code.html` → `tailwind.config`)
 * so every Stitch class name renders identically. Only two deliberate changes:
 *  - `surface-dim` is `#dfd9cf` (some Stitch screens contain the typo `"dfd9cf"` without the hash),
 *  - fontFamily entries point to the `next/font/local` CSS variables instead of Google Fonts names
 *    (+ `sans`/`serif` aliases so plain `font-sans`/`font-serif` use the brand fonts too).
 * Keep `src/lib/utils.ts` (tailwind-merge config) in sync when adding font sizes or spacing tokens.
 * Additions (not in Stitch): the `coarse:` variant (`@media (pointer: coarse)`) used to give touch screens ≥ 44 px tap
 * targets without changing the desktop rendering, and the `.tap-target` utility in globals.css.
 */
const inter = ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
const playfair = ['var(--font-playfair)', '"Playfair Display"', 'Georgia', 'ui-serif', 'serif']

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'surface-container': '#f3ede2',
        'on-tertiary-container': '#98bf89',
        outline: '#70787c',
        'tertiary-container': '#2c4e23',
        'surface-container-high': '#ede8dd',
        'on-secondary': '#ffffff',
        'on-primary': '#ffffff',
        'on-primary-fixed': '#001f28',
        tertiary: '#16370f',
        'on-tertiary-fixed-variant': '#2d4f24',
        'on-background': '#1d1c15',
        'tertiary-fixed-dim': '#aad19a',
        'on-surface-variant': '#40484b',
        'inverse-on-surface': '#f6f0e5',
        'on-primary-container': '#87bbce',
        'on-secondary-fixed': '#370e00',
        'on-error': '#ffffff',
        'inverse-surface': '#333029',
        'surface-variant': '#e8e2d7',
        secondary: '#9c441e',
        'primary-fixed-dim': '#9acee1',
        surface: '#fff9ee',
        'surface-container-highest': '#e8e2d7',
        'surface-dim': '#dfd9cf',
        'on-surface': '#1d1c15',
        background: '#fff9ee',
        'primary-container': '#0f4c5c',
        'on-tertiary-fixed': '#022100',
        'error-container': '#ffdad6',
        'secondary-fixed': '#ffdbce',
        'primary-fixed': '#b6ebfe',
        'inverse-primary': '#9acee1',
        'on-tertiary': '#ffffff',
        'surface-container-low': '#f9f3e8',
        error: '#ba1a1a',
        'surface-container-lowest': '#ffffff',
        'on-error-container': '#93000a',
        'on-secondary-fixed-variant': '#7d2d08',
        'surface-bright': '#fff9ee',
        'secondary-fixed-dim': '#ffb59a',
        'on-primary-fixed-variant': '#114d5d',
        'secondary-container': '#ff9064',
        'on-secondary-container': '#752803',
        primary: '#003441',
        'surface-tint': '#306576',
        'tertiary-fixed': '#c5eeb4',
        'outline-variant': '#c0c8cb',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        'margin-md': '3rem',
        'gutter-lg': '2.5rem',
        'space-3xl': '6rem',
        'space-lg': '1.5rem',
        margin: '1.5rem',
        gutter: '1.5rem',
        'space-xl': '2.5rem',
        'margin-lg': '5rem',
        'space-2xl': '4rem',
        'space-md': '1rem',
        'space-sm': '0.5rem',
        'space-xs': '0.25rem',
      },
      fontFamily: {
        sans: inter,
        serif: playfair,
        'label-md': inter,
        'headline-sm': playfair,
        'label-lg': inter,
        'headline-xl': playfair,
        'headline-md': playfair,
        'display-lg-mobile': playfair,
        'body-md': inter,
        'body-lg': inter,
        'display-lg': playfair,
        caption: inter,
        'body-xl': inter,
        'headline-xl-mobile': playfair,
        'headline-lg-mobile': playfair,
        'headline-lg': playfair,
      },
      fontSize: {
        'label-md': ['11px', { lineHeight: '16px', letterSpacing: '0.1em', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'label-lg': ['13px', { lineHeight: '18px', letterSpacing: '0.08em', fontWeight: '600' }],
        'headline-xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '500' }],
        'display-lg-mobile': ['38px', { lineHeight: '46px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '26px', fontWeight: '400' }],
        'display-lg': ['56px', { lineHeight: '64px', letterSpacing: '-0.02em', fontWeight: '600' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'body-xl': ['18px', { lineHeight: '30px', letterSpacing: '-0.005em', fontWeight: '300' }],
        'headline-xl-mobile': ['30px', { lineHeight: '38px', letterSpacing: '0', fontWeight: '600' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '500' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '500' }],
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('coarse', '@media (pointer: coarse)')
    }),
  ],
}

export default config
