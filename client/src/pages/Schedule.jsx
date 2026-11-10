// Schedule.jsx - Módulo de gestión de horarios (vista principal de "Gestión")
// Los horarios se guardan en MySQL a través de la API (/api/schedules),
// con estructura relacional: schedules → schedule_days → schedule_breaks + schedule_prefs.
// La generación automática sin choques (RF-04/RF-05) y la exportación real a
// PDF/Excel (RF-09) quedan pendientes para una versión posterior.
import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { getSchedules, deleteSchedule } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import CreateSchedule from './CreateSchedule';

function Schedule() {
    const { t } = useLanguage();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showWizard, setShowWizard] = useState(false);
    const [editingId, setEditingId] = useState(null);   // id del horario a editar
    const [wizardPhase, setWizardPhase] = useState(1);  // fase inicial del asistente
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getSchedules();
            setSchedules(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar horarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditingId(null); setWizardPhase(1); setShowWizard(true); };
    const openEdit = (s) => { setEditingId(s.schedule_id); setWizardPhase(1); setShowWizard(true); };
    // Exportar: abre el horario directamente en el paso de Generación (Step 6), donde se exporta.
    const openExport = (s) => { setEditingId(s.schedule_id); setWizardPhase(6); setShowWizard(true); };

    const handleDelete = async () => {
        try {
            await deleteSchedule(deleteTarget.schedule_id);
            setDeleteTarget(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar');
        }
    };

    const closeWizard = (changed) => {
        setShowWizard(false);
        setEditingId(null);
        if (changed) load(); // recarga la lista si se guardó algo
    };

    // Si el asistente está activo, se muestra en lugar de la lista
    if (showWizard) {
        return <CreateSchedule editingId={editingId} initialPhase={wizardPhase} onBack={closeWizard} />;
    }

    const fmtDate = (d) => {
        try { return new Date(d).toLocaleDateString(); } catch { return d; }
    };

    return (
        <>
            <div className="dashboard-header">
                <h1>{t('dash_title')}</h1>
            </div>

            <section className="table-container">
                {loading && <p className="loading-text">{t('loading')}</p>}
                {error && <p className="error-msg" style={{ display: 'block' }}>{error}</p>}

                {!loading && !error && schedules.length === 0 && (
                    <div className="empty-state">
                        <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <p className="opaque-text">{t('no_schedules')}</p>
                    </div>
                )}

                {!loading && !error && schedules.length > 0 && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('col_name')}</th>
                                <th>{t('col_date')}</th>
                                <th>{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map(s => (
                                <tr key={s.schedule_id}>
                                    <td>#{s.schedule_id}</td>
                                    <td>
                                        <strong>{s.name || t('schedule_untitled')}</strong>
                                        {s.is_draft ? <span className="draft-badge">{t('draft_badge')}</span> : null}
                                    </td>
                                    <td>{fmtDate(s.created_at)}</td>
                                    <td className="table-actions">
                                        <button title={t('edit')} onClick={() => openEdit(s)}>✏️</button>
                                        <button title={t('action_export')} onClick={() => openExport(s)}>📥</button>
                                        <button title={t('remove')} onClick={() => setDeleteTarget(s)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <button className="add-schedule-btn" onClick={openCreate}>
                    <span>+</span> {t('schedule_create')}
                </button>
            </section>

            {/* Modal eliminar */}
            {deleteTarget && (
                <Modal title={t('remove')} onClose={() => setDeleteTarget(null)}>
                    <p className="confirm-text">
                        {t('sched_del_q1')}<strong>{deleteTarget.name}</strong>{t('sched_del_q2')}
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>{t('btn_cancel')}</button>
                        <button className="btn-danger" onClick={handleDelete}>{t('remove')}</button>
                    </div>
                </Modal>
            )}

        </>
    );
}

export default Schedule;