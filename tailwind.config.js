/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      'white': '#ffffff',
      'charles-blue': '#091F2F',
      'optimistic-blue': '#288BE4',
      'freedom-red': '#FB4D42',
      'blue-1': '#061622',
      'blue-2': '#0C2639',
      'blue-3': '#45789C',
      'blue-4': '#51ACFF',
      'gray-1': '#58585B',
      'gray-2': '#D2D2D2',
      'gray-3': '#E0E0E0',
      'gray-4': '#F2F2F2',
    },
    extend: {
      fontFamily: {
        'sans': ['Montserrat'],
        'serif': ['Lora']
      },
    },
  },
  plugins: [],
}