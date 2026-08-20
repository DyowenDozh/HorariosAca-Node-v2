// LanguageSelector.jsx - Botón desplegable ES/EN (portado de navbar.js / dashboard)
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

function LanguageSelector() {
    const { lang, setLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    const pick = (l) => { setLanguage(l); setOpen(false); };

    return (
        <li className="lang-selector" ref={ref}>
            <button className="lang-btn" onClick={() => setOpen(o => !o)}>
                🌐 <span>{lang === 'en' ? 'English' : 'Español'}</span>
            </button>
            {open && (
                <div className="lang-dropdown">
                    <button onClick={() => pick('en')}>English</button>
                    <button onClick={() => pick('es')}>Español</button>
                </div>
            )}
        </li>
    );
}

export default LanguageSelector;
