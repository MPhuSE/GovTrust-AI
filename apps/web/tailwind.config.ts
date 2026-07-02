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
        navy: {
          DEFAULT: '#082441',
          50: '#eaeff5',
          100: '#c5d3e3',
          500: '#255081',
          900: '#082441',
        },
        ivory: {
          DEFAULT: '#F9F7F2',
          50: '#ffffff',
          100: '#F9F7F2',
          500: '#d1cbb8',
          900: '#75705e',
        },
        gold: {
          DEFAULT: '#C8A161',
          100: '#f7f1e6',
          500: '#C8A161',
          900: '#695129',
        },
        teal: {
          DEFAULT: '#0D7A91',
          100: '#e0f5f9',
          500: '#0D7A91',
          900: '#053945',
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
