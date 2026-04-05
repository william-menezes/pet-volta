/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        surface: '#FFFFFF',
        text: '#111827',
      },
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        pet: '24px',
        'pet-sm': '16px',
      },
      spacing: {
        'pet-1': '8px',
        'pet-2': '16px',
        'pet-3': '24px',
        'pet-4': '32px',
        'pet-5': '40px',
        'pet-6': '48px',
      },
      backgroundImage: {
        'gradient-blue-violet': 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
        'gradient-red-orange': 'linear-gradient(135deg, #DC2626 0%, #D97706 100%)',
      },
    },
  },
  plugins: [],
};
