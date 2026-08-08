// App.jsx - Main application with routing logic
import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem('token')
    );

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    return (
        <>
            {isAuthenticated
                ? <Dashboard onLogout={handleLogout} />
                : <Login onLoginSuccess={handleLoginSuccess} />
            }
        </>
    );
}

export default App;