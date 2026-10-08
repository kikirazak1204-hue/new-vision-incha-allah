import React, { useState, useEffect } from 'react';

export default function AutoTranslator() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Évite de charger le script plusieurs fois
        if (document.getElementById('google-translate-script')) return;

        // Initialisation de Google Translate
        window.googleTranslateElementInit = () => {
            if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: 'fr',
                        includedLanguages: 'fr,en,de,ru',
                        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                        autoDisplay: false,
                    },
                    'google_translate_element'
                );
            }
        };

        // Injection du script Google
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {/* Menu de choix de langue escamotable */}
            {open && (
                <div className="mb-2 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl animate-fadeIn max-w-[220px]">
                    <div id="google_translate_element" className="overflow-hidden rounded-lg"></div>
                </div>
            )}

            {/* Bouton Symbole compact */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                title="Traduire la page"
                className="w-10 h-10 rounded-full bg-[#061a3a] border border-white/20 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 hover:scale-105 transition-all text-lg"
            >
                🌐
            </button>
        </div>
    );
}