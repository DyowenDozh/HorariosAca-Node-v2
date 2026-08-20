// TutorialsInternal.jsx - Vista de tutoriales dentro del dashboard
import { useLanguage } from '../i18n/LanguageContext';

function TutorialsInternal() {
    const { t } = useLanguage();
    return (
        <>
            <div className="dashboard-header">
                <h1>{t('nav_tutorials')}</h1>
            </div>
            <section className="table-container">
                <div className="empty-state">
                    <p className="opaque-text">Sección de tutoriales en video. Contenido próximamente disponible.</p>
                </div>
            </section>
        </>
    );
}

export default TutorialsInternal;
