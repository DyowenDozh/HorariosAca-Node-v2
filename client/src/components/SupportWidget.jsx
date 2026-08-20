// SupportWidget.jsx - Widget flotante de soporte WhatsApp/Email (portado de support.js)
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

function SupportWidget() {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);

    return (
        <div className="support-wrapper">
            {open && (
                <div className="support-options">
                    <a
                        href="https://wa.me/573218878123"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="support-item whatsapp"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z" /></svg>
                        <span>{t('support_whatsapp')}</span>
                    </a>
                    <a
                        href="mailto:soporte@horariosaca.com"
                        className="support-item email"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        <span>{t('support_email_btn')}</span>
                    </a>
                </div>
            )}

            <button className="main-support-btn" onClick={() => setOpen(o => !o)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                <span className="support-label">{t('support_help_btn')}</span>
            </button>
        </div>
    );
}

export default SupportWidget;
