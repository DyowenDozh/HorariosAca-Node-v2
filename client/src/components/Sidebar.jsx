// Sidebar.jsx - Barra lateral colapsable (réplica del sidebar.js del proyecto original)
// Ítems originales: Schedules · Upgrade Plan · Tutorials · Account Settings · Trash bin · Logout
// "Schedules" despliega los módulos reales conectados a la BD: Profesores, Materias, Grados.
import { useState } from 'react';
import {
    IconChevronLeft, IconChevronRight, IconSchedule, IconPlan, IconTutorials,
    IconSettings, IconTrash, IconLogout, IconTeacher, IconSubject, IconGrade
} from './Icons';
import { useLanguage } from '../i18n/LanguageContext';

function Sidebar({ active, onNavigate, onLogout, collapsed, onToggle }) {
    const { t, lang, setLanguage } = useLanguage();
    // El submenú de gestión (Schedules) se abre si estás en cualquiera de sus módulos
    const inManagement = ['schedule', 'teachers', 'subjects', 'grades'].includes(active);
    const [openMgmt, setOpenMgmt] = useState(inManagement);

    return (
        <aside id="main-sidebar" className={collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}>
            <div className="sidebar-header">
                <span className="logo-text">HorariosAca</span>
                <button id="toggle-sidebar" title="Toggle Menu" onClick={onToggle}>
                    {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
                </button>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {/* Gestión de horarios */}
                    <li>
                        <button
                            className={active === 'schedule' ? 'active' : ''}
                            onClick={() => onNavigate('schedule')}
                        >
                            <IconSchedule />
                            <span>{t('side_management')}</span>
                        </button>
                    </li>

                    {/* Upgrade Plan */}
                    <li>
                        <button className={active === 'plans' ? 'active' : ''} onClick={() => onNavigate('plans')}>
                            <IconPlan /><span>{t('side_plans')}</span>
                        </button>
                    </li>

                    {/* Tutorials */}
                    <li>
                        <button className={active === 'tutorials' ? 'active' : ''} onClick={() => onNavigate('tutorials')}>
                            <IconTutorials /><span>{t('nav_tutorials')}</span>
                        </button>
                    </li>

                    {/* Account Settings */}
                    <li>
                        <button className={active === 'settings' ? 'active' : ''} onClick={() => onNavigate('settings')}>
                            <IconSettings /><span>{t('side_settings') !== 'side_settings' ? t('side_settings') : 'Ajustes de cuenta'}</span>
                        </button>
                    </li>

                    {/* Trash bin */}
                    <li>
                        <button className={active === 'trash' ? 'active' : ''} onClick={() => onNavigate('trash')}>
                            <IconTrash /><span>{t('side_trash')}</span>
                        </button>
                    </li>
                </ul>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-lang">
                    <button
                        className={active === '__lang_es' ? '' : ''}
                        onClick={() => setLanguage('es')}
                        style={{ opacity: lang === 'es' ? 1 : 0.55 }}
                    >
                        <span>🌐</span><span>Español</span>
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        style={{ opacity: lang === 'en' ? 1 : 0.55 }}
                    >
                        <span>🌐</span><span>English</span>
                    </button>
                </div>

                <button onClick={onLogout}>
                    <IconLogout />
                    <span>{t('side_logout') !== 'side_logout' ? t('side_logout') : 'Cerrar sesión'}</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
