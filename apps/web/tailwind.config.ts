import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.{js,ts,jsx,tsx,mdx,css}',
  ],
  theme: {
    extend: {
      colors: {
        navy: { // Mapped to Dark Gray for text
          DEFAULT: '#1e293b',
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          900: '#0f172a',
        },
        ivory: { // Mapped to Flat White/Light Gray for backgrounds
          DEFAULT: '#f9fafb',
          50: '#ffffff',
          100: '#f3f4f6',
          500: '#9ca3af',
          900: '#111827',
        },
        gold: { // Mapped to National Yellow
          DEFAULT: '#f59e0b',
          100: '#fef3c7',
          500: '#f59e0b',
          900: '#78350f',
        },
        teal: { // Mapped to National Red
          DEFAULT: '#dc2626',
          100: '#fee2e2',
          500: '#ef4444',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
