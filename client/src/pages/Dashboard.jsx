// Dashboard Page - Protected page showing teachers list
import { useState, useEffect } from 'react';
import { getTeachers } from '../services/api';

function Dashboard({ onLogout }) {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const data = await getTeachers();
                setTeachers(data.data || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Error loading teachers');
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onLogout();
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.logo}>HorariosAca</h1>
                <div style={styles.userInfo}>
                    <span>Welcome, {user.nombre}</span>
                    <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
                </div>
            </header>

            <main style={styles.main}>
                <h2 style={styles.title}>Teachers</h2>

                {loading && <p>Loading...</p>}
                {error && <p style={styles.error}>{error}</p>}

                {!loading && !error && (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Hours/Week</th>
                                <th style={styles.th}>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.length === 0 ? (
                                <tr><td colSpan="4" style={styles.empty}>No teachers found</td></tr>
                            ) : (
                                teachers.map(t => (
                                    <tr key={t.teacher_id}>
                                        <td style={styles.td}>#{t.teacher_id}</td>
                                        <td style={styles.td}>{t.teacher_name}</td>
                                        <td style={styles.td}>{t.amount_hour}</td>
                                        <td style={styles.td}>{new Date(t.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </main>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f0f0f5' },
    header: { backgroundColor: '#564AC6', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { color: '#fff', margin: 0 },
    userInfo: { display: 'flex', alignItems: 'center', gap: '16px', color: '#fff' },
    logoutBtn: { padding: '8px 16px', backgroundColor: 'transparent', color: '#fff', border: '1.5px solid #fff', borderRadius: '8px', cursor: 'pointer' },
    main: { padding: '32px' },
    title: { color: '#333', marginBottom: '24px' },
    table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    th: { padding: '12px 16px', backgroundColor: '#564AC6', color: '#fff', textAlign: 'left' },
    td: { padding: '12px 16px', borderBottom: '1px solid #eee' },
    empty: { padding: '24px', textAlign: 'center', color: '#888' },
    error: { color: 'red' }
};

export default Dashboard;