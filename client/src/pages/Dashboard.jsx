// sidebar + navegación entre vistas
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Teachers from './Teachers';
import Subjects from './Subjects';
import Grades from './Grades';
import Schedule from './Schedule';
import Settings from './Settings';
import Trash from './Trash';
import PlansInternal from './PlansInternal';
import TutorialsInternal from './TutorialsInternal';
import SupportWidget from '../components/SupportWidget';
import { Footer } from '../components/PublicChrome';
import { hasExitToList, runExitToList } from '../utils/navGuard';

function Dashboard({ onLogout }) {
    const [view, setView] = useState('schedule');
    const [collapsed, setCollapsed] = useState(false);

    // Navegación sidebar Si se está editando un horario y se pulsa
    // "Gestión" sale a la lista de horariios
    const navigate = (target) => {
        if (target === 'schedule' && hasExitToList()) {
            runExitToList();
            return;
        }
        setView(target);
    };

    const handleLogout = () => {
        const lang = localStorage.getItem('preferred_lang');
        localStorage.clear();
        if (lang) localStorage.setItem('preferred_lang', lang);
        onLogout();
    };

    const renderView = () => {
        switch (view) {
            case 'schedule': return <Schedule />;
            case 'teachers': return <Teachers />;
            case 'subjects': return <Subjects />;
            case 'grades': return <Grades />;
            case 'plans': return <PlansInternal />;
            case 'tutorials': return <TutorialsInternal />;
            case 'settings': return <Settings onLogout={handleLogout} />;
            case 'trash': return <Trash />;
            default: return <Schedule />;
        }
    };

    return (
        <>
            <Sidebar
                active={view}
                onNavigate={navigate}
                onLogout={handleLogout}
                collapsed={collapsed}
                onToggle={() => setCollapsed(c => !c)}
            />
            <main className={`internal-content ${collapsed ? 'collapsed' : ''}`}>
                {renderView()}
                <Footer onNavigate={() => {}} />
            </main>
            <SupportWidget />
        </>
    );
}

export default Dashboard;
