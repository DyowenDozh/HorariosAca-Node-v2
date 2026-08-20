// Login.jsx - Página de inicio de sesión (diseño portado del proyecto original)
import { useState } from 'react';
import { loginUser } from '../services/api';
import { Navbar, Footer } from '../components/PublicChrome';
import SupportWidget from '../components/SupportWidget';
import { useLanguage } from '../i18n/LanguageContext';

function Login({ onLoginSuccess, onNavigate }) {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await loginUser(email, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onLoginSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Navbar view="login" onNavigate={onNavigate} />

            <main className="login-container">
                <form id="login-form" onSubmit={handleSubmit}>
                    <h2>{t('login_title')}</h2>

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

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? '...' : t('btn_login')}
                    </button>

                    {error && <p className="error-msg" style={{ display: 'block' }}>{error}</p>}

                    <p>
                        {t('no_account')}{' '}
                        <a onClick={() => onNavigate('register')}>{t('link_register')}</a>
                    </p>
                </form>
            </main>

            <SupportWidget />
            <Footer onNavigate={onNavigate} />
        </div>
    );
}

export default Login;
