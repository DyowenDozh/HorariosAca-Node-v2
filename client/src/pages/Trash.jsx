// Trash.jsx - Papelera de horarios (soft delete): restaurar o eliminar definitivamente
import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { getScheduleTrash, restoreSchedule, deleteSchedulePermanent } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

function Trash() {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [purgeTarget, setPurgeTarget] = useState(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getScheduleTrash();
            setItems(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar la papelera');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleRestore = async (id) => {
        try {
            await restoreSchedule(id);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al restaurar');
        }
    };

    const handlePurge = async () => {
        try {
            await deleteSchedulePermanent(purgeTarget.schedule_id);
            setPurgeTarget(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar');
        }
    };

    const fmtDate = (d) => {
        try { return new Date(d).toLocaleDateString(); } catch { return d; }
    };

    return (
        <>
            <div className="dashboard-header">
                <h1>{t('side_trash')}</h1>
            </div>

            <section className="table-container">
                {loading && <p className="loading-text">{t('loading')}</p>}
                {error && <p className="error-msg" style={{ display: 'block' }}>{error}</p>}

                {!loading && !error && items.length === 0 && (
                    <div className="empty-state">
                        <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                        <p className="opaque-text">{t('trash_empty')}</p>
                    </div>
                )}

                {!loading && !error && items.length > 0 && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('col_name')}</th>
                                <th>{t('trash_deleted_at')}</th>
                                <th>{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(s => (
                                <tr key={s.schedule_id}>
                                    <td>#{s.schedule_id}</td>
                                    <td><strong>{s.name}</strong></td>
                                    <td>{fmtDate(s.deleted_at)}</td>
                                    <td className="table-actions">
                                        <button title={t('trash_restore')} onClick={() => handleRestore(s.schedule_id)}>↩️</button>
                                        <button title={t('trash_delete_forever')} onClick={() => setPurgeTarget(s)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {purgeTarget && (
                <Modal title={t('trash_delete_forever')} onClose={() => setPurgeTarget(null)}>
                    <p className="confirm-text">
                        {t('trash_purge_confirm')} <strong>{purgeTarget.name}</strong>. {t('trash_purge_warning')}
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setPurgeTarget(null)}>{t('btn_cancel')}</button>
                        <button className="btn-danger" onClick={handlePurge}>{t('trash_delete_forever')}</button>
                    </div>
                </Modal>
            )}
        </>
    );
}

export default Trash;