/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Tokens semánticos, resueltos vía CSS variables (ver src/index.css).
        // Cambian según el tema (oscuro por defecto / claro).
        base: 'var(--color-bg-base)',
        surface: 'var(--color-bg-surface)',
        elevated: 'var(--color-bg-elevated)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted': 'var(--color-text-muted)',
        'accent-ok': 'var(--color-accent-ok)',
        'accent-warn': 'var(--color-accent-warn)',
        'accent-bad': 'var(--color-accent-bad)',
        // Colores oficiales de línea (§7 / §13). Únicos acentos saturados.
        line: {
          A: '#18CCCC',
          B: '#EB0909',
          C: '#2A7AC4',
          D: '#01823F',
          E: '#6C2C8E',
          H: '#FFD800',
          P: '#9CCB3B',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        control: '8px',
        chip: '6px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.4)',
      },
      letterSpacing: {
        heading: '-0.02em',
      },
    },
  },
  plugins: [],
};
