// PlansInternal.jsx - Vista de planes dentro del dashboard (sin navbar pública)
// El botón Premium activa el plan; el botón Básico lo desactiva (cancelar / pruebas).
// Nota: no hay pasarela de pago real; la activación es simulada (trabajo futuro).
import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { getProfile, setPlan } from '../services/api';

function PlansInternal() {
    const { t } = useLanguage();
    const [premium, setPremium] = useState(() => {
        try { return !!JSON.parse(localStorage.getItem('user'))?.is_premium; } catch { return false; }
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // Refresca el estado real del plan desde el backend
    useEffect(() => {
        (async () => {
            try { const r = await getProfile(); applyState(!!r.data?.is_premium); } catch { /* usa el de localStorage */ }
        })();
    }, []);

    const applyState = (val) => {
        setPremium(val);
        try { const u = JSON.parse(localStorage.getItem('user')) || {}; u.is_premium = val; localStorage.setItem('user', JSON.stringify(u)); } catch { /* ignore */ }
    };

    const choose = async (val) => {
        if (saving || val === premium) return;
        setSaving(true); setMsg('');
        try {
            const r = await setPlan(val);
            applyState(!!r.is_premium);
            setMsg(val ? t('plan_now_premium') : t('plan_now_basic'));
        } catch {
            setMsg(t('plan_change_error'));
        } finally { setSaving(false); }
    };

    return (
        <>
            <div className="dashboard-header">
                <h1>{t('plans_title')}</h1>
            </div>
            <p style={{ color: 'var(--text-soft)', marginBottom: '10px' }}>{t('plans_subtitle')}</p>
            {msg && <p className="global-msg" style={{ color: 'var(--success)', marginBottom: '10px' }}>{msg}</p>}

            <div className="plans-grid">
                <div className={`plan-card${!premium ? ' featured' : ''}`}>
                    {!premium && <span className="badge">{t('plan_current')}</span>}
                    <h2>{t('plan_basic_name')}</h2>
                    <div className="price">{t('price_free')}</div>
                    <ul className="plan-features">
                        <li>{t('feat_view')}</li>
                        <li>{t('feat_entry')}</li>
                        <li>{t('feat_download')}</li>
                        <li className="disabled">{t('feat_gen_disabled')}</li>
                        <li className="disabled">{t('feat_edit_disabled')}</li>
                    </ul>
                    <button className="btn-select" onClick={() => choose(false)} disabled={saving || !premium}>
                        {!premium ? t('plan_current') : t('btn_basic')}
                    </button>
                </div>

                <div className={`plan-card${premium ? ' featured' : ''}`}>
                    <span className="badge">{premium ? t('plan_current') : t('badge_premium')}</span>
                    <h2>{t('plan_premium_name')}</h2>
                    <div className="price">$49.99 <span>USD</span></div>
                    <ul className="plan-features">
                        <li>{t('feat_gen_engine')}</li>
                        <li>{t('feat_manual_control')}</li>
                        <li>{t('feat_conflict')}</li>
                        <li>{t('feat_unlimited')}</li>
                        <li>{t('feat_priority')}</li>
                    </ul>
                    <button className="btn-select premium" onClick={() => choose(true)} disabled={saving || premium}>
                        {premium ? t('plan_current') : t('btn_premium')}
                    </button>
                </div>
            </div>
        </>
    );
}

export default PlansInternal;