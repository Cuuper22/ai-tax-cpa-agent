/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: {
          0: 'oklch(0.10 0.01 270)',
          1: 'oklch(0.14 0.012 270)',
          2: 'oklch(0.18 0.015 270)',
        },
        accent: {
          DEFAULT: 'oklch(0.70 0.25 290)',
          muted: 'oklch(0.70 0.25 290 / 0.15)',
        },
        teal: {
          DEFAULT: 'oklch(0.75 0.20 180)',
          muted: 'oklch(0.75 0.20 180 / 0.15)',
        },
        border: 'oklch(0.25 0.012 270)',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}
