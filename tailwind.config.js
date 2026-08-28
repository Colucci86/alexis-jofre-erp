/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0F1729',
        darkCard: '#1E293B',
        darkSidebar: '#0B0F19',
        accentBlue: '#3B82F6',
        accentBlueHover: '#2563EB',
      }
    },
  },
  plugins: [],
}
