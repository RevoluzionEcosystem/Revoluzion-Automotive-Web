import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#111111',
        'surface-variant': '#1A1A1A',
        'surface-elevated': '#1F1F1F',
        'surface-light': '#222222',
        border: '#1F2937',
        'border-light': '#374151',
        primary: '#06B6D4',
        'primary-dark': '#0891B2',
        'primary-light': '#22D3EE',
        teal: '#14B8A6',
        blue: '#3B82F6',
        'blue-dark': '#2563EB',
        'text-primary': '#FFFFFF',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
        'text-disabled': '#4B5563',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #14B8A6 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
        'gradient-card': 'linear-gradient(180deg, #1A1A1A 0%, #111111 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #06B6D4, 0 0 10px #06B6D4' },
          '100%': { boxShadow: '0 0 20px #06B6D4, 0 0 40px #06B6D480' },
        },
      },
    },
  },
  plugins: [],
}

export default config
