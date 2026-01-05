/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          black: '#000000',
          purple: '#8B5CF6',
          blue: '#3B82F6',
          'purple-light': '#A78BFA',
          'blue-light': '#60A5FA',
        },
        gradient: {
          start: '#000000',
          middle: '#4C1D95',
          end: '#1E40AF'
        }
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(135deg, #000000 0%, #4C1D95 50%, #1E40AF 100%)',
        'purple-gradient-hover': 'linear-gradient(135deg, #1a1a1a 0%, #5B21B6 50%, #2563EB 100%)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #8B5CF6, 0 0 10px #8B5CF6, 0 0 15px #8B5CF6' },
          '100%': { boxShadow: '0 0 10px #3B82F6, 0 0 20px #3B82F6, 0 0 30px #3B82F6' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [],
}