/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#c2410c',
          hover: '#ea580c',
          light: '#fdba74',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        serif: ['Playfair Display', 'serif'],
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'bounce-subtle': 'bounce-subtle 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        // Adicionando tempos menores para os toasts e modais
        in: 'fade-in 0.3s ease-out',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  // ✅ Plugins adicionados para scrollbar elegante e animações prontas
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar')({ nocompatible: true })],
};
