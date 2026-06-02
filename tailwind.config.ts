import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
    './lib/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0B0F17',
          surface: '#1a2535',
          gold: '#C9A25F',
          ink: '#F7F7F5',
          muted: '#A9B1BE',
          cream: '#F4F1EA',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': '#1a1a1a',
            '--tw-prose-headings': '#2C3E50',
            '--tw-prose-links': '#2d5f8a',
            '--tw-prose-bold': '#2C3E50',
            maxWidth: '65ch',
          },
        },
      },
    },
  },
  plugins: [typography],
}
export default config
