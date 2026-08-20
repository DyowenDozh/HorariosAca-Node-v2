// App.jsx - Enrutamiento por estado. Vista pública por defecto: Home (landing).
import { useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Terms from './pages/Terms';
import Plans from './pages/Plans';
import Tutorials from './pages/Tutorials';
import Dashboard from './pages/Dashboard';
import { LanguageProvider } from './i18n/LanguageContext';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem('token')
    );
    // Vista pública activa cuando no hay sesión
    const [publicView, setPublicView] = useState('home');

    const handleLoginSuccess = () => setIsAuthenticated(true);
    const handleLogout = () => {
        setIsAuthenticated(false);
        setPublicView('home');
    };

    const renderPublic = () => {
        switch (publicView) {
            case 'home': return <Home onNavigate={setPublicView} />;
            case 'login': return <Login onLoginSuccess={handleLoginSuccess} onNavigate={setPublicView} />;
            case 'register': return <Register onNavigate={setPublicView} />;
            case 'terms': return <Terms onNavigate={setPublicView} />;
            case 'plans': return <Plans onNavigate={setPublicView} />;
            case 'tutorials': return <Tutorials onNavigate={setPublicView} />;
            default: return <Home onNavigate={setPublicView} />;
        }
    };

    return (
        <LanguageProvider>
            {isAuthenticated
                ? <Dashboard onLogout={handleLogout} />
                : renderPublic()}
        </LanguageProvider>
    );
}

export default App;
