// Terms.jsx - Términos y condiciones (portado de terms.html original)
import { Navbar, Footer } from '../components/PublicChrome';
import { useLanguage } from '../i18n/LanguageContext';

function Terms({ onNavigate }) {
    const { t } = useLanguage();

    const sections = [1, 2, 3, 4, 5];

    return (
        <div className="auth-page">
            <Navbar view="terms" onNavigate={onNavigate} />

            <main className="legal-container">
                <div className="legal-content">
                    <h1>{t('terms_main_title')}</h1>
                    <p className="last-updated">{t('terms_last_updated')}</p>

                    {sections.map(n => (
                        <div className="legal-section" key={n}>
                            <h2>{t(`terms_sec${n}_title`)}</h2>
                            <p>{t(`terms_sec${n}_text`)}</p>
                        </div>
                    ))}

                    <button className="back-link" onClick={() => onNavigate('home')}>
                        {t('terms_back')}
                    </button>
                </div>
            </main>

            <Footer onNavigate={onNavigate} />
        </div>
    );
}

export default Terms;
