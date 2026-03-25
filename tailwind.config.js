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
                    50: 'rgba(200,255,0,0.04)',
                    100: 'rgba(200,255,0,0.08)',
                    200: 'rgba(200,255,0,0.15)',
                    300: 'rgba(200,255,0,0.3)',
                    400: '#C8FF00',
                    500: '#C8FF00',
                    600: '#C8FF00',
                    700: '#b0e000',
                    800: '#8ab300',
                    900: '#658600',
                },
                dark: {
                    DEFAULT: '#09090B',
                    surface: '#1C1C21',
                    border: 'rgba(255,255,255,0.08)',
                },
                lime: {
                    DEFAULT: '#C8FF00',
                    dim: 'rgba(200,255,0,0.12)',
                },
                teal: '#00D4AA',
                muted: '#71717A',
                dim: '#52525B',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                sora: ['Sora', 'sans-serif'],
                grotesk: ['Space Grotesk', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '16px',
                '3xl': '20px',
            },
        },
    },
    plugins: [],
}
