/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        destructive: '#ef4444',
        background: '#1e1e2e',
        foreground: '#cdd6f4',
        card: '#313244',
        'card-foreground': '#cdd6f4',
        border: '#45475a',
        input: '#313244',
        ring: '#b4befe',
      },
    },
  },
  plugins: [],
}