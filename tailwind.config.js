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
        oguc: {
          compliant: '#10B981', // Verde conforme
          barrier: '#EF4444',   // Rojo infracción bloqueante
          warning: '#F59E0B',   // Amarillo advertencia ergonomía / radio
          info: '#38BDF8',      // Azul información
          dark: '#0B0F17',
          card: '#131B2A',
          border: '#1E293B',
          hover: '#1E293B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
