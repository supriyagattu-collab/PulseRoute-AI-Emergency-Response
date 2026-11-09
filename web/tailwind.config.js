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
          950: '#07152B', // Deep navy
          900: '#0B1F3A', // Primary navy
          800: '#102A4E',
        },
        primary: {
          blue: '#1769FF',
          darkBlue: '#0F55D6',
        },
        emergency: {
          red: '#EF233C',
          crimson: '#D90429',
          darkRed: '#8D0801',
        },
        surface: {
          light: '#F4F7FC',
          card: '#FFFFFF',
          border: '#DCE5F0',
          textMain: '#14213D',
          textMuted: '#64748B',
        },
        priority: {
          p1: '#EF233C', // Critical
          p2: '#F59E0B', // Urgent
          p3: '#EAB308', // Moderate
          p4: '#10B981', // Routine
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}
