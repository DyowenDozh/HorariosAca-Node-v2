// Register.jsx - Página de registro de usuario (diseño portado del proyecto original)
import { useState } from 'react';
import { registerUser } from '../services/api';
import { Navbar, Footer } from '../components/PublicChrome';
import SupportWidget from '../components/SupportWidget';
import { useLanguage } from '../i18n/LanguageContext';

function Register({ onNavigate }) {
    const { t } = useLanguage();
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [ok, setOk] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setOk('');

        if (password !== confirm) {
            setError(t('error_password_mismatch'));
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            await registerUser(nombre, email, password);
            setOk('¡Cuenta creada! Ya puedes iniciar sesión.');
            setNombre(''); setEmail(''); setPassword(''); setConfirm('');
        } catch (err) {
            setError(err.response?.data?.message || t('error_email_exists'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Navbar view="register" onNavigate={onNavigate} />

            <main className="register-container">
                <form id="register-form" onSubmit={handleSubmit}>
                    <h2>{t('register_title')}</h2>

                    <div className="input-group">
                        <label htmlFor="nombre">Nombre completo</label>
                        <input
                            type="text"
                            id="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Tu nombre"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">{t('label_user')}</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">{t('label_password')}</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirm">{t('label_confirm_password')}</label>
                        <input
                            type="password"
                            id="confirm"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="********"
                            required
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? t('msg_registering') : t('btn_register')}
                    </button>

                    {error && <p className="global-msg bad">{error}</p>}
                    {ok && <p className="global-msg ok">{ok}</p>}

                    <p>
                        {t('have_account')}{' '}
                        <a onClick={() => onNavigate('login')}>{t('link_login')}</a>
                    </p>
                </form>
            </main>

            <SupportWidget />
            <Footer onNavigate={onNavigate} />
        </div>
    );
}

export default Register;
