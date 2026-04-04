/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Triggering rebuild for new customer directory
  ],
  theme: {
    extend: {
      colors: {
        booking: {
          blue: '#003580',          // Deep blue header
          yellow: '#febb02',        // Yellow search highlight
          'light-blue': '#006ce4',  // Link/Secondary button blue
          gray: '#f5f5f5',          // Background gray
          text: '#1a1a1a',          // Dark text
          muted: '#595959',         // Muted text
          red: '#d4111e',           // Alert/Urgency red
        }
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
      },
      boxShadow: {
        'booking': '0 2px 8px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
