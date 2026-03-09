/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        storm: {
          900: '#020617',
          800: '#0b1220',
          700: '#0f172a',
          600: '#1e293b'
        },
        skyblue: '#1e3a5f',
        cyanglow: '#00d4ff'
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(0, 212, 255, 0.35)'
      }
    }
  },
  plugins: []
};

