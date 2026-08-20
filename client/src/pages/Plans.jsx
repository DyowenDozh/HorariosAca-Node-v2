// Plans.jsx - Página de planes Básico / Premium (portado de plans.html)
import { Navbar, Footer } from '../components/PublicChrome';
import { useLanguage } from '../i18n/LanguageContext';

function Plans({ onNavigate }) {
    const { t } = useLanguage();

    return (
        <div className="auth-page">
            <Navbar view="plans" onNavigate={onNavigate} />

            <main style={{ flex: 1, padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <h1 style={{ textAlign: 'center', color: 'var(--primary)' }}>{t('plans_title')}</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-soft)', marginBottom: '20px' }}>
                    {t('plans_subtitle')}
                </p>

                <div className="plans-grid">
                    {/* Plan Básico */}
                    <div className="plan-card">
                        <h2>{t('plan_basic_name')}</h2>
                        <div className="price">{t('price_free')}</div>
                        <ul className="plan-features">
                            <li>{t('feat_view')}</li>
                            <li>{t('feat_entry')}</li>
                            <li>{t('feat_download')}</li>
                            <li className="disabled">{t('feat_gen_disabled')}</li>
                            <li className="disabled">{t('feat_edit_disabled')}</li>
                        </ul>
                        <button className="btn-select" onClick={() => onNavigate('register')}>
                            {t('btn_basic')}
                        </button>
                    </div>

                    {/* Plan Premium */}
                    <div className="plan-card featured">
                        <span className="badge">{t('badge_premium')}</span>
                        <h2>{t('plan_premium_name')}</h2>
                        <div className="price">$49.99 <span>USD</span></div>
                        <ul className="plan-features">
                            <li>{t('feat_gen_engine')}</li>
                            <li>{t('feat_manual_control')}</li>
                            <li>{t('feat_conflict')}</li>
                            <li>{t('feat_unlimited')}</li>
                            <li>{t('feat_priority')}</li>
                        </ul>
                        <button className="btn-select premium" onClick={() => onNavigate('register')}>
                            {t('btn_premium')}
                        </button>
                    </div>
                </div>
            </main>

            <Footer onNavigate={onNavigate} />
        </div>
    );
}

export default Plans;
