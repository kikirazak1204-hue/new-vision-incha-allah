/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // Ajoute cette ligne pour activer le mode sombre via une classe
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                noir: "#0a0a0a",
                blancTransparent: "rgba(255,255,255,0.1)",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
            animation: {
                "fade-in": "fadeIn 1s ease-in-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: 0 },
                    "100%": { opacity: 1 },
                },
            },
        },
    },
    plugins: [],
};