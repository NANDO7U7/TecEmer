import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                eco: {
                    'green-dark': '#2D4F1E',
                    'green': '#4A7C34',
                    'green-light': '#6B9B4E',
                    'cream': '#F5F1EB',
                    'white': '#FFFFFF',
                    'gray': '#6B7280',
                    'dark': '#1A2E12',
                },
                bin: {
                    yellow: '#F59E0B',
                    green: '#22C55E',
                    brown: '#92400E',
                    gray: '#6B7280',
                    red: '#EF4444',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                '4xl': '2rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
            },
        },
    },
    plugins: [],
};
export default config;
