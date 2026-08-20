// PlansInternal.jsx - Vista de planes dentro del dashboard (sin navbar pública)
import { useLanguage } from '../i18n/LanguageContext';

function PlansInternal() {
    const { t } = useLanguage();
    return (
        <>
            <div className="dashboard-header">
                <h1>{t('plans_title')}</h1>
            </div>
            <p style={{ color: 'var(--text-soft)', marginBottom: '10px' }}>{t('plans_subtitle')}</p>

            <div className="plans-grid">
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
                    <button className="btn-select">{t('btn_basic')}</button>
                </div>

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
                    <button className="btn-select premium">{t('btn_premium')}</button>
                </div>
            </div>
        </>
    );
}

export default PlansInternal;
