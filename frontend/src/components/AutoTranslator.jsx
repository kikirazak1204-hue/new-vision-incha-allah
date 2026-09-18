import React, { useEffect } from 'react';

export default function AutoTranslator() {
  useEffect(() => {
    // Évite de charger le script plusieurs fois
    if (document.getElementById('google-translate-script')) return;

    // Initialisation de Google Translate
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'fr', // Langue de base de ton application
          includedLanguages: 'fr,en,de,ru', // FR, Anglais, Allemand, Russe
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    // Injection du script Google
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="auto-translator-wrapper">
      {/* C'est ici que Google va injecter son bouton magique */}
      <div id="google_translate_element" className="overflow-hidden rounded-lg"></div>
    </div>
  );
}