// Settings.jsx - Ajustes de cuenta con estilo de tarjetas (login/registro)
import { useState, useEffect } from 'react';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../services/api';
import Modal from '../components/Modal';
import { useLanguage } from '../i18n/LanguageContext';

// Ojo para mostrar/ocultar contraseña
const EyeIcon = ({ open }) => open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
);

function Settings({ onLogout }) {
    const { t } = useLanguage();

    const [profile, setProfile] = useState(null);
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [editingProfile, setEditingProfile] = useState(false);
    const [msg, setMsg] = useState({ text: '', ok: true });

    // Cambio de contraseña
    const [curPass, setCurPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [showCur, setShowCur] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [passMsg, setPassMsg] = useState({ text: '', ok: true });

    const [confirmDelete, setConfirmDelete] = useState(false);

    const loadProfile = async () => {
        try {
            const res = await getProfile();
            setProfile(res.data);
            setNombre(res.data.nombre);
            setEmail(res.data.email);
        } catch {
            setMsg({ text: t('settings_load_error'), ok: false });
        }
    };

    useEffect(() => { loadProfile(); }, []);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setMsg({ text: '', ok: true });
        try {
            const res = await updateProfile(nombre, email);
            setProfile(p => ({ ...p, ...res.data }));
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...stored, nombre, email }));
            setEditingProfile(false);
            setMsg({ text: t('settings_saved'), ok: true });
        } catch (err) {
            setMsg({ text: err.response?.data?.message || t('settings_save_error'), ok: false });
        }
    };

    const cancelEdit = () => {
        setNombre(profile.nombre);
        setEmail(profile.email);
        setEditingProfile(false);
        setMsg({ text: '', ok: true });
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPassMsg({ text: '', ok: true });
        if (newPass.length < 6) {
            setPassMsg({ text: t('settings_pass_short'), ok: false });
            return;
        }
        try {
            await changePassword(curPass, newPass);
            setCurPass(''); setNewPass('');
            setShowCur(false); setShowNew(false);
            setPassMsg({ text: t('settings_pass_ok'), ok: true });
        } catch (err) {
            setPassMsg({ text: err.response?.data?.message || t('settings_pass_error'), ok: false });
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount();
            const lang = localStorage.getItem('preferred_lang');
            localStorage.clear();
            if (lang) localStorage.setItem('preferred_lang', lang);
            if (onLogout) onLogout();
        } catch {
            setMsg({ text: t('settings_delete_error'), ok: false });
            setConfirmDelete(false);
        }
    };

    if (!profile) {
        return (
            <>
                <div className="dashboard-header"><h1>{t('settings_title')}</h1></div>
                <p className="loading-text">{t('loading')}</p>
            </>
        );
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>{t('settings_title')}</h1>
            </div>

            <div className="settings-wrapper">
                {/* Tarjeta: Perfil */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h2>{t('settings_profile')}</h2>
                        {!editingProfile && (
                            <button className="link-btn" onClick={() => setEditingProfile(true)}>
                                {t('settings_edit')}
                            </button>
                        )}
                    </div>

                    {/* Datos de solo lectura (siempre como texto) */}
                    <div className="read-field">
                        <span className="read-label">{t('settings_user_id')}</span>
                        <span className="read-value">#{profile.user_id}</span>
                    </div>
                    <div className="read-field">
                        <span className="read-label">{t('settings_created_at')}</span>
                        <span className="read-value">{new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>

                    {!editingProfile ? (
                        <>
                            <div className="read-field">
                                <span className="read-label">{t('settings_name')}</span>
                                <span className="read-value">{profile.nombre}</span>
                            </div>
                            <div className="read-field">
                                <span className="read-label">{t('label_user')}</span>
                                <span className="read-value">{profile.email}</span>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSaveProfile}>
                            <div className="input-group">
                                <label>{t('settings_name')}</label>
                                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label>{t('label_user')}</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={cancelEdit}>{t('btn_cancel')}</button>
                                <button type="submit" className="submit-btn">{t('settings_save')}</button>
                            </div>
                        </form>
                    )}

                    {msg.text && (
                        <p className="global-msg" style={{ color: msg.ok ? 'var(--success)' : 'var(--error)' }}>{msg.text}</p>
                    )}
                </div>

                {/* Tarjeta: Cambiar contraseña */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h2>{t('settings_change_pass')}</h2>
                    </div>
                    <form onSubmit={handleChangePassword}>
                        <div className="input-group">
                            <label>{t('settings_current_pass')}</label>
                            <div className="password-field">
                                <input
                                    type={showCur ? 'text' : 'password'}
                                    value={curPass}
                                    onChange={(e) => setCurPass(e.target.value)}
                                    required
                                />
                                <button type="button" className="toggle-pass" onClick={() => setShowCur(s => !s)} title={showCur ? t('hide') : t('show')}>
                                    <EyeIcon open={showCur} />
                                </button>
                            </div>
                        </div>
                        <div className="input-group">
                            <label>{t('settings_new_pass')}</label>
                            <div className="password-field">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    required
                                />
                                <button type="button" className="toggle-pass" onClick={() => setShowNew(s => !s)} title={showNew ? t('hide') : t('show')}>
                                    <EyeIcon open={showNew} />
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="submit-btn">{t('settings_update_pass')}</button>
                        {passMsg.text && (
                            <p className="global-msg" style={{ color: passMsg.ok ? 'var(--success)' : 'var(--error)' }}>{passMsg.text}</p>
                        )}
                    </form>
                </div>

                {/* Tarjeta: Zona de peligro */}
                <div className="settings-card danger">
                    <div className="settings-card-header">
                        <h2 style={{ color: 'var(--error)' }}>{t('settings_danger')}</h2>
                    </div>
                    <p style={{ color: 'var(--text-soft)', marginBottom: '15px' }}>{t('settings_danger_text')}</p>
                    <button className="btn-delete-account" onClick={() => setConfirmDelete(true)}>
                        {t('settings_delete_account')}
                    </button>
                </div>
            </div>

            {confirmDelete && (
                <Modal title={t('settings_delete_account')} onClose={() => setConfirmDelete(false)}>
                    <p className="confirm-text">{t('settings_delete_confirm')}</p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>{t('btn_cancel')}</button>
                        <button className="btn-danger" onClick={handleDeleteAccount}>{t('settings_delete_account')}</button>
                    </div>
                </Modal>
            )}
        </>
    );
}

export default Settings;