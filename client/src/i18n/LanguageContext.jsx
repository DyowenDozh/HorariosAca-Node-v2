// LanguageContext.jsx - Manejo de idioma ES/EN (equivalente React de language-switcher.js)
import { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(
        () => localStorage.getItem('preferred_lang') || 'es'
    );

    const setLanguage = useCallback((newLang) => {
        localStorage.setItem('preferred_lang', newLang);
        setLang(newLang);
    }, []);

    // t(key): devuelve el texto traducido, o la propia key si no existe
    const t = useCallback((key) => {
        return translations[lang]?.[key] ?? translations.es?.[key] ?? key;
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage debe usarse dentro de LanguageProvider');
    return ctx;
}
