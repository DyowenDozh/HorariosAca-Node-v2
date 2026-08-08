// Login Page - Handles user authentication
import { useState } from 'react';
import { loginUser } from '../services/api';

function Login({ onLoginSuccess }) {
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
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>HorariosAca</h2>
                <p style={styles.subtitle}>Sign in to your account</p>

                <form onSubmit={handleSubmit}>
                    <div style={styles.group}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            placeholder="email@example.com"
                            required
                        />
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p style={styles.error}>{error}</p>}

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f0f5' },
    card: { backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
    title: { textAlign: 'center', color: '#564AC6', marginBottom: '4px' },
    subtitle: { textAlign: 'center', color: '#888', marginBottom: '24px' },
    group: { marginBottom: '16px' },
    label: { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' },
    input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', backgroundColor: '#564AC6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
    error: { color: 'red', fontSize: '0.9rem', marginBottom: '8px' }
};

export default Login;