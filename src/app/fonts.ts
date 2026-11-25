import localFont from 'next/font/local'

/**
 * Brand fonts, self-hosted from @fontsource-variable (Google Fonts is unreachable from the build sandbox — never use
 * next/font/google). Exposed as CSS variables that tailwind.config.ts maps to every Stitch fontFamily key.
 */
export const inter = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-italic.woff2',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
})

export const playfair = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2',
      weight: '400 900',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2',
      weight: '400 900',
      style: 'italic',
    },
  ],
  variable: '--font-playfair',
  display: 'swap',
  fallback: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
})

/** Class names to put on <html> so the CSS variables exist everywhere (also inside portals/dialogs). */
export const fontVariables = `${inter.variable} ${playfair.variable}`
