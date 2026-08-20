// Tutorials.jsx - Página de tutoriales (marcador de posición del proyecto original)
import { Navbar, Footer } from '../components/PublicChrome';
import { useLanguage } from '../i18n/LanguageContext';

function Tutorials({ onNavigate }) {
    const { t } = useLanguage();

    return (
        <div className="auth-page">
            <Navbar view="tutorials" onNavigate={onNavigate} />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--primary)', marginBottom: '10px' }}>{t('nav_tutorials')}</h1>
                <p style={{ color: 'var(--text-soft)', maxWidth: '500px' }}>
                    Sección de tutoriales en video. Contenido próximamente disponible.
                </p>
            </main>

            <Footer onNavigate={onNavigate} />
        </div>
    );
}

export default Tutorials;
