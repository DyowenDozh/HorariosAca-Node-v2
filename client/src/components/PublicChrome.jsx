// PublicChrome.jsx - Navbar superior y footer para páginas públicas (portado de navbar.js/footer.js)
import { IconHome, IconLogin } from './Icons';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';

// Iconos adicionales para la navbar pública
const IconRegister = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg>
);
const IconTutorials = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
);

export function Navbar({ view, onNavigate }) {
    const { t } = useLanguage();
    return (
        <header id="main-navbar">
            <nav className="nav-container">
                <div className="nav-logo">HorariosAca</div>
                <ul className="nav-links">
                    <li>
                        <a className={view === 'home' ? 'active' : ''} onClick={() => onNavigate('home')}>
                            <IconHome /> <span>{t('nav_home')}</span>
                        </a>
                    </li>
                    <li>
                        <a className={view === 'register' ? 'active' : ''} onClick={() => onNavigate('register')}>
                            <IconRegister /> <span>{t('nav_register')}</span>
                        </a>
                    </li>
                    <li>
                        <a className={view === 'login' ? 'active' : ''} onClick={() => onNavigate('login')}>
                            <IconLogin /> <span>{t('nav_login')}</span>
                        </a>
                    </li>
                    <li>
                        <a className={view === 'tutorials' ? 'active' : ''} onClick={() => onNavigate('tutorials')}>
                            <IconTutorials /> <span>{t('nav_tutorials')}</span>
                        </a>
                    </li>
                    <LanguageSelector />
                </ul>
            </nav>
        </header>
    );
}

export function Footer({ onNavigate }) {
    const { t } = useLanguage();
    return (
        <footer id="main-footer">
            <div className="footer-content">
                <p>
                    &copy; 2026 HorariosAca. {t('footer_rights')}
                    <a className="footer-link" onClick={() => onNavigate && onNavigate('terms')}>
                        {t('terms_main_title')}
                    </a>
                </p>
            </div>
        </footer>
    );
}
