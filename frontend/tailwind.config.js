/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'lg:grid-cols-3',
    'lg:col-span-1',
    'lg:col-span-2',
  ],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0a0f1e', 800: '#0d1630', 700: '#111d44', 600: '#162259', 500: '#1e3a8a' },
        brand: { DEFAULT: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
        electric: { DEFAULT: '#06b6d4', light: '#67e8f9', dark: '#0891b2' },
        surface: { DEFAULT: '#1a2540', card: '#1f2d4a', border: '#2a3d6b' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
      },
      gridTemplateColumns: {
        // Custom 25/50/25 staff dashboard layout
        'staff': 'minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)',
      },
    },
  },
  plugins: [],
};
