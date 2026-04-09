/** @type {import('tailwindcss').Config} */
// Paleta "Organic & Safe" â€” inspirada em Plamev (https://plamev.com.br/)
// MigraÃ§Ã£o de Blue-Tech â†’ Green-Organic (v4)
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Paleta Green-Organic
        primary: '#2D6A4F', // ConfianÃ§a, Natureza, Cuidado â€” CTAs, links, Ã­cones
        secondary: '#FFB01F', // Alegria, AtenÃ§Ã£o Positiva â€” badges premium, destaque
        accent: '#8FBC8F', // Suavidade, Bem-estar â€” backgrounds de cards secundÃ¡rios
        success: '#1B4332', // SeguranÃ§a total â€” status safe, confirmaÃ§Ãµes
        warning: '#F59E0B', // AtenÃ§Ã£o â€” estados pendentes, alertas moderados
        danger: '#BC4749', // UrgÃªncia (sem pÃ¢nico) â€” modo lost, aÃ§Ãµes crÃ­ticas
        surface: '#FDFCF0', // Acolhimento, Conforto â€” background principal (off-white/creme)
        text: '#1A1C19', // Legibilidade, Seriedade â€” tipografia e labels
      },
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px
      },
      borderRadius: {
        // Squircle â€” efeito "Plamev": formas orgÃ¢nicas e acolhedoras
        pet: '32px', // Cards principais â€” rounded-pet
        'pet-sm': '16px', // Elementos menores â€” rounded-pet-sm
        // BotÃµes e inputs usam rounded-full (estilo pÃ­lula)
      },
      spacing: {
        'pet-1': '8px',
        'pet-2': '16px',
        'pet-3': '24px',
        'pet-4': '32px',
        'pet-5': '40px',
        'pet-6': '48px',
      },
      boxShadow: {
        // Sombras muito suaves baseadas no Primary (#2D6A4F)
        pet: '0 2px 16px 0 rgba(45, 106, 79, 0.07)',
        'pet-md': '0 4px 24px 0 rgba(45, 106, 79, 0.10)',
      },
      backgroundImage: {
        // Gradiente hero Green-Organic
        'gradient-green': 'linear-gradient(135deg, #2D6A4F 0%, #8FBC8F 100%)',
        // Gradiente para modo lost (urgÃªncia)
        'gradient-danger': 'linear-gradient(135deg, #BC4749 0%, #F59E0B 100%)',
        // Gradiente para card Elite
        'gradient-elite': 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
      },
    },
  },
  plugins: [],
};
