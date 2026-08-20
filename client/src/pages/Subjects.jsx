// Subjects.jsx - Módulo CRUD de materias conectado a /api/subjects
// Al agregar: elegir de una lista predefinida o escribir el nombre.
// Sigla automática (3 primeras letras en mayúscula), editable, máx 10.
// Duplicados: bloqueados; si se confirma crear otra igual, se numera (Inglés 2 / ING2).
import { useState, useEffect } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../services/api';
import Modal from '../components/Modal';
import { useLanguage } from '../i18n/LanguageContext';

// Materias predefinidas para el desplegable
const PREDEFINED = [
    'Matemáticas', 'Español', 'Sociales', 'Trigonometría', 'Geometría', 'Inglés',
    'Artística', 'Religión', 'Ética', 'Política', 'Biología', 'Ciencias Naturales',
    'Informática', 'Cálculo', 'Física', 'Química', 'Estadística',
];

// Genera sigla por defecto: 3 primeras letras en mayúscula (sin tildes)
function defaultAbbr(name) {
    const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return clean.slice(0, 3).toUpperCase();
}

function Subjects({ scheduleId }) {
    const { t } = useLanguage();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [selectValue, setSelectValue] = useState('');      // valor del desplegable
    const [name, setName] = useState('');
    const [abbr, setAbbr] = useState('');
    const [abbrTouched, setAbbrTouched] = useState(false);   // si el usuario editó la sigla a mano
    const [color, setColor] = useState('#564AC6');

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [dupConfirm, setDupConfirm] = useState(null);      // {name, abbr, color} pendiente de confirmar

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getSubjects(scheduleId);
            setSubjects(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar materias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setSelectValue('');
        setName('');
        setAbbr('');
        setAbbrTouched(false);
        setColor('#564AC6');
        setFormOpen(true);
    };

    const openEdit = (s) => {
        setEditing(s);
        setSelectValue('__other__');
        setName(s.subject_name);
        setAbbr(s.abbreviation || defaultAbbr(s.subject_name));
        setAbbrTouched(true);
        setColor(s.color_id || '#564AC6');
        setFormOpen(true);
    };

    // Cuando eligen del desplegable
    const handleSelect = (val) => {
        setSelectValue(val);
        if (val === '__other__' || val === '') {
            setName('');
            if (!abbrTouched) setAbbr('');
        } else {
            setName(val);
            if (!abbrTouched) setAbbr(defaultAbbr(val));
        }
    };

    // Cuando escriben el nombre (modo "Otra")
    const handleName = (val) => {
        setName(val);
        if (!abbrTouched) setAbbr(defaultAbbr(val));
    };

    // Cuenta cuántas materias tienen el mismo nombre base (ignorando el número final)
    const countSameBase = (baseName) => {
        const re = new RegExp(`^${baseName}( \\d+)?$`, 'i');
        return subjects.filter(s => re.test(s.subject_name.trim())).length;
    };

    const doCreate = async (finalName, finalAbbr, finalColor) => {
        try {
            await createSubject(finalName, finalColor, finalAbbr, scheduleId);
            setFormOpen(false);
            setDupConfirm(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        const finalAbbr = (abbr || defaultAbbr(trimmed)).slice(0, 10);

        if (editing) {
            try {
                await updateSubject(editing.subject_id, trimmed, color, finalAbbr);
                setFormOpen(false);
                load();
            } catch (err) {
                setError(err.response?.data?.message || 'Error al guardar');
            }
            return;
        }

        // Crear: revisar duplicados por nombre exacto
        const exists = subjects.some(s => s.subject_name.trim().toLowerCase() === trimmed.toLowerCase());
        if (exists) {
            // Preparar la versión numerada y pedir confirmación
            const count = countSameBase(trimmed) + 1;
            const numberedName = `${trimmed} ${count}`;
            const numberedAbbr = (defaultAbbr(trimmed) + count).slice(0, 10);
            setDupConfirm({ original: trimmed, name: numberedName, abbr: numberedAbbr, color });
            return;
        }

        doCreate(trimmed, finalAbbr, color);
    };

    return (
        <>
            <div className="dashboard-header">
                <h1>{t('subjects_title') !== 'subjects_title' ? t('subjects_title') : 'Gestión de Materias'}</h1>
            </div>

            <section className="table-container">
                {loading && <p className="loading-text">{t('loading')}</p>}
                {error && <p className="error-msg" style={{ display: 'block' }}>{error}</p>}

                {!loading && !error && subjects.length === 0 && (
                    <div className="empty-state">
                        <p className="opaque-text">{t('subjects_empty') !== 'subjects_empty' ? t('subjects_empty') : 'No hay materias. Usa el botón para agregar una.'}</p>
                    </div>
                )}

                {!loading && !error && subjects.length > 0 && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('subj_name') !== 'subj_name' ? t('subj_name') : 'Materia'}</th>
                                <th>{t('subj_abbr') !== 'subj_abbr' ? t('subj_abbr') : 'Sigla'}</th>
                                <th>{t('subj_color') !== 'subj_color' ? t('subj_color') : 'Color'}</th>
                                <th>{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map(s => (
                                <tr key={s.subject_id}>
                                    <td>#{s.subject_id}</td>
                                    <td><strong>{s.subject_name}</strong></td>
                                    <td>{s.abbreviation || defaultAbbr(s.subject_name)}</td>
                                    <td>
                                        <span className="color-dot" style={{ backgroundColor: s.color_id }}></span>
                                        {s.color_id}
                                    </td>
                                    <td className="table-actions">
                                        <button title={t('edit')} onClick={() => openEdit(s)}>✏️</button>
                                        <button title={t('remove')} onClick={() => setDeleteTarget(s)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <button className="add-inline-btn" onClick={openCreate}>
                    <span>+</span> {t('subj_add') !== 'subj_add' ? t('subj_add') : 'Nueva materia'}
                </button>
            </section>

            {/* Modal crear / editar */}
            {formOpen && (
                <Modal
                    title={editing ? (t('subj_edit') !== 'subj_edit' ? t('subj_edit') : 'Editar materia') : (t('subj_add') !== 'subj_add' ? t('subj_add') : 'Nueva materia')}
                    onClose={() => setFormOpen(false)}
                >
                    <form onSubmit={handleSubmit}>
                        {!editing && (
                            <div className="input-group">
                                <label>{t('subj_choose') !== 'subj_choose' ? t('subj_choose') : 'Elige una materia'}</label>
                                <select value={selectValue} onChange={(e) => handleSelect(e.target.value)}>
                                    <option value="">{t('subj_select_ph') !== 'subj_select_ph' ? t('subj_select_ph') : '— Selecciona o escribe —'}</option>
                                    {PREDEFINED.map(m => <option key={m} value={m}>{m}</option>)}
                                    <option value="__other__">{t('subj_other') !== 'subj_other' ? t('subj_other') : 'Otra (escribir)'}</option>
                                </select>
                            </div>
                        )}

                        {(editing || selectValue === '__other__' || selectValue === '') && (
                            <div className="input-group">
                                <label>{t('subj_name') !== 'subj_name' ? t('subj_name') : 'Nombre de la materia'}</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => handleName(e.target.value)}
                                    placeholder="Ej: Matemáticas"
                                    required
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label>{t('subj_abbr') !== 'subj_abbr' ? t('subj_abbr') : 'Sigla'} ({t('subj_abbr_hint') !== 'subj_abbr_hint' ? t('subj_abbr_hint') : 'máx 10'})</label>
                            <input
                                type="text"
                                value={abbr}
                                maxLength={10}
                                onChange={(e) => { setAbbr(e.target.value.toUpperCase()); setAbbrTouched(true); }}
                                placeholder="MAT"
                            />
                        </div>

                        <div className="input-group">
                            <label>{t('subj_color') !== 'subj_color' ? t('subj_color') : 'Color identificador'}</label>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                style={{ height: '48px', padding: '4px', cursor: 'pointer' }}
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>{t('btn_cancel')}</button>
                            <button type="submit" className="submit-btn">{editing ? t('settings_save') : t('wizard_next')}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal confirmar duplicado */}
            {dupConfirm && (
                <Modal title={t('subj_dup_title') !== 'subj_dup_title' ? t('subj_dup_title') : 'Materia duplicada'} onClose={() => setDupConfirm(null)}>
                    <p className="confirm-text">
                        {(t('subj_dup_text') !== 'subj_dup_text' ? t('subj_dup_text') : 'Ya existe una materia llamada')} <strong>{dupConfirm.original}</strong>. {(t('subj_dup_text2') !== 'subj_dup_text2' ? t('subj_dup_text2') : '¿Deseas crear otra? Se guardará como')} <strong>{dupConfirm.name}</strong> ({dupConfirm.abbr}).
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setDupConfirm(null)}>{t('btn_cancel')}</button>
                        <button className="submit-btn" onClick={() => doCreate(dupConfirm.name, dupConfirm.abbr, dupConfirm.color)}>
                            {t('subj_dup_yes') !== 'subj_dup_yes' ? t('subj_dup_yes') : 'Sí, crear'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal eliminar */}
            {deleteTarget && (
                <Modal title={t('remove')} onClose={() => setDeleteTarget(null)}>
                    <p className="confirm-text">
                        ¿Seguro que deseas eliminar la materia <strong>{deleteTarget.subject_name}</strong>? Esta acción no se puede deshacer.
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>{t('btn_cancel')}</button>
                        <button className="btn-danger" onClick={async () => {
                            try { await deleteSubject(deleteTarget.subject_id); setDeleteTarget(null); load(); }
                            catch (err) { setError(err.response?.data?.message || 'Error al eliminar'); }
                        }}>{t('remove')}</button>
                    </div>
                </Modal>
            )}
        </>
    );
}

export default Subjects;