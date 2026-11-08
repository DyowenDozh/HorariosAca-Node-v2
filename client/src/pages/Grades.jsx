// Grades.jsx - Fase 3: grados y su malla curricular (materias + horas por grado)
// Dos niveles: (1) lista de grados; (2) malla de un grado con tabla de asignaturas.
// Al "Agregar asignatura" se abre un dual-list para elegir varias materias.
// El total de horas del grado se recalcula desde la estructura de la Fase 1.
import { useState, useEffect, useMemo, useRef } from 'react';
import {
    getGrades, createGrade, updateGrade, deleteGrade,
    getSubjects, getGradeCurriculum, saveGradeCurriculum
} from '../services/api';
import Modal from '../components/Modal';
import { useLanguage } from '../i18n/LanguageContext';

// Calcula el total de horas de la semana según la config de la Fase 1
function computeWeeklyHours(dayMode, days, workDays) {
    if (!days) return 0;
    if (dayMode === 'uniform') {
        const d = days.all || {};
        const activeDays = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
            .filter(k => workDays?.[k]).length;
        return (Number(d.hoursPerDay) || 0) * activeDays;
    }
    // por día: suma las horas de cada día laboral
    return ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
        .filter(k => workDays?.[k])
        .reduce((sum, k) => sum + (Number(days[k]?.hoursPerDay) || 0), 0);
}

function Grades({ scheduleId, dayMode, days, workDays, newGradeSignal }) {
    const { t } = useLanguage();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [name, setName] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Vista de malla curricular de un grado
    const [curriculumGrade, setCurriculumGrade] = useState(null);

    const totalHours = useMemo(
        () => computeWeeklyHours(dayMode, days, workDays),
        [dayMode, days, workDays]
    );

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getGrades(scheduleId);
            setGrades(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar grados');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setName(''); setFormOpen(true); };

    // Señal desde el asistente ("Añadir otro grado"): salir de la malla y
    // abrir el formulario de nuevo grado. Solo reacciona a CAMBIOS reales de la
    // señal, no al valor que ya traía al montar (evita abrirlo al entrar al paso 3).
    const lastGradeSignal = useRef(newGradeSignal);
    useEffect(() => {
        if (newGradeSignal === lastGradeSignal.current) return;
        lastGradeSignal.current = newGradeSignal;
        setCurriculumGrade(null);
        openCreate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newGradeSignal]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await createGrade(name, scheduleId);
            setFormOpen(false);
            // Ir directo a la malla del grado recién creado
            const newId = res?.data?.grade_id;
            await load();
            if (newId) {
                setCurriculumGrade({ grade_id: newId, grade_name: name });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteGrade(deleteTarget.grade_id);
            setDeleteTarget(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar');
        }
    };

    // Si estamos viendo la malla de un grado, mostrar esa pantalla
    if (curriculumGrade) {
        return (
            <GradeCurriculum
                grade={curriculumGrade}
                scheduleId={scheduleId}
                totalHours={totalHours}
                grades={grades}
                onBack={() => { setCurriculumGrade(null); load(); }}
                t={t}
            />
        );
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>{t('grades_title') !== 'grades_title' ? t('grades_title') : 'Gestión de Grados'}</h1>
            </div>

            <section className="table-container">
                {loading && <p className="loading-text">{t('loading')}</p>}
                {error && <p className="error-msg" style={{ display: 'block' }}>{error}</p>}

                {!loading && !error && grades.length === 0 && (
                    <div className="empty-state">
                        <p className="opaque-text">{t('grades_empty') !== 'grades_empty' ? t('grades_empty') : 'No hay grados. Usa el botón para crear uno.'}</p>
                    </div>
                )}

                {!loading && !error && grades.length > 0 && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('grade_name_col') !== 'grade_name_col' ? t('grade_name_col') : 'Grado / Salón'}</th>
                                <th>{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grades.map(g => (
                                <tr key={g.grade_id}>
                                    <td>#{g.grade_id}</td>
                                    <td><strong>{g.grade_name}</strong></td>
                                    <td className="table-actions">
                                        <button title={t('grade_curriculum') !== 'grade_curriculum' ? t('grade_curriculum') : 'Malla curricular'} onClick={() => setCurriculumGrade(g)}>📚</button>
                                        <button title={t('remove')} onClick={() => setDeleteTarget(g)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <button className="add-inline-btn" onClick={openCreate}>
                    <span>+</span> {t('grade_add') !== 'grade_add' ? t('grade_add') : 'Nuevo grado'}
                </button>
            </section>

            {formOpen && (
                <Modal title={t('grade_add') !== 'grade_add' ? t('grade_add') : 'Nuevo grado'} onClose={() => setFormOpen(false)}>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>{t('grade_name_label') !== 'grade_name_label' ? t('grade_name_label') : 'Nombre del grado o salón'}</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: 10-A" required />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>{t('btn_cancel')}</button>
                            <button type="submit" className="submit-btn">{t('wizard_next')}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {deleteTarget && (
                <Modal title={t('remove')} onClose={() => setDeleteTarget(null)}>
                    <p className="confirm-text">
                        ¿Seguro que deseas eliminar el grado <strong>{deleteTarget.grade_name}</strong>? Esta acción no se puede deshacer.
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

/* ---------- Malla curricular de un grado ---------- */
function GradeCurriculum({ grade, scheduleId, totalHours, grades, onBack, t }) {
    const [allSubjects, setAllSubjects] = useState([]);
    const [rows, setRows] = useState([]); // [{subject_id, subject_name, color_id, weekly_hours}]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    // Nombre del grado (editable en línea)
    const [gradeName, setGradeName] = useState(grade.grade_name);
    const [editingName, setEditingName] = useState(false);

    const saveName = async () => {
        const trimmed = gradeName.trim();
        if (!trimmed) { setGradeName(grade.grade_name); setEditingName(false); return; }
        try {
            await updateGrade(grade.grade_id, trimmed);
            grade.grade_name = trimmed; // refleja el cambio localmente
            setEditingName(false);
        } catch {
            setError('Error al renombrar el grado');
        }
    };

    // Dual-list modal
    const [pickerOpen, setPickerOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [pendingSel, setPendingSel] = useState([]); // subject_ids elegidos en el modal

    // Copiar malla
    const [copyFrom, setCopyFrom] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const subsRes = await getSubjects(scheduleId);
            setAllSubjects(subsRes.data || []);
            const curRes = await getGradeCurriculum(grade.grade_id);
            const cur = (curRes.data || []).map(r => ({
                subject_id: r.subject_id,
                subject_name: r.subject_name,
                color_id: r.color_id,
                weekly_hours: r.weekly_hours,
                teacher_name: r.teacher_name || null,
            }));
            setRows(cur);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar la malla');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const usedHours = rows.reduce((sum, r) => sum + (Number(r.weekly_hours) || 0), 0);
    const available = totalHours - usedHours;

    // Materias que aún no están en la malla (para el dual-list)
    const notAssigned = allSubjects.filter(s => !rows.some(r => r.subject_id === s.subject_id));
    const filteredAvail = notAssigned.filter(s =>
        s.subject_name.toLowerCase().includes(search.toLowerCase())
    );

    const openPicker = () => { setPendingSel([]); setSearch(''); setPickerOpen(true); };

    const togglePending = (id) => {
        setPendingSel(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
    };

    const confirmPicker = () => {
        const toAdd = allSubjects
            .filter(s => pendingSel.includes(s.subject_id))
            .map(s => ({ subject_id: s.subject_id, subject_name: s.subject_name, color_id: s.color_id, weekly_hours: 0 }));
        setRows(r => [...r, ...toAdd]);
        setPickerOpen(false);
    };

    const setHours = (subjectId, h) => {
        setRows(r => r.map(x => x.subject_id === subjectId ? { ...x, weekly_hours: Number(h) } : x));
    };

    const removeRow = (subjectId) => {
        setRows(r => r.filter(x => x.subject_id !== subjectId));
    };

    const handleCopy = async (fromGradeId) => {
        setCopyFrom(fromGradeId);
        if (!fromGradeId) return;
        try {
            const res = await getGradeCurriculum(fromGradeId);
            const copied = (res.data || []).map(r => ({
                subject_id: r.subject_id, subject_name: r.subject_name,
                color_id: r.color_id, weekly_hours: r.weekly_hours,
            }));
            setRows(copied);
        } catch {
            setError('Error al copiar la malla');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSavedMsg('');
        try {
            await saveGradeCurriculum(grade.grade_id, rows.map(r => ({
                subject_id: r.subject_id, weekly_hours: r.weekly_hours,
            })));
            setSavedMsg(t('curriculum_saved') !== 'curriculum_saved' ? t('curriculum_saved') : 'Malla guardada.');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar la malla');
        } finally {
            setSaving(false);
        }
    };

    // Opciones de horas para el dropdown: 0 hasta (disponible + lo que ya tiene esa fila)
    const hoursOptions = (row) => {
        const max = available + (Number(row.weekly_hours) || 0);
        const arr = [];
        for (let i = 0; i <= Math.max(max, 0); i++) arr.push(i);
        return arr;
    };

    const otherGrades = grades.filter(g => g.grade_id !== grade.grade_id);

    return (
        <>
            <div className="dashboard-header">
                <h1>
                    {t('grade_curriculum') !== 'grade_curriculum' ? t('grade_curriculum') : 'Malla curricular'} ·{' '}
                    {editingName ? (
                        <input
                            type="text"
                            value={gradeName}
                            onChange={(e) => setGradeName(e.target.value)}
                            onBlur={saveName}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }}
                            autoFocus
                            style={{ fontSize: '1rem', padding: '4px 8px', width: '160px' }}
                        />
                    ) : (
                        <>
                            {grade.grade_name}
                            <button className="link-btn" style={{ marginLeft: '8px', fontSize: '0.9rem' }} onClick={() => { setGradeName(grade.grade_name); setEditingName(true); }}>✏️</button>
                        </>
                    )}
                </h1>
                <button className="link-btn" onClick={onBack}>← {t('grades_back') !== 'grades_back' ? t('grades_back') : 'Volver a grados'}</button>
            </div>

            <div className="settings-card" style={{ maxWidth: '760px', margin: '0 auto' }}>
                {loading && <p className="loading-text">{t('loading')}</p>}
                {error && <p className="error-msg" style={{ display: 'block' }}>{error}</p>}

                {!loading && allSubjects.length === 0 && (
                    <div className="empty-state">
                        <p className="opaque-text">{t('no_subjects_first') !== 'no_subjects_first' ? t('no_subjects_first') : 'Primero crea materias en la Fase 2.'}</p>
                    </div>
                )}

                {!loading && allSubjects.length > 0 && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <button className="add-inline-btn" onClick={openPicker} style={{ marginTop: 0 }}>
                                <span>+</span> {t('add_subject_to_grade') !== 'add_subject_to_grade' ? t('add_subject_to_grade') : 'Agregar asignatura'}
                            </button>
                            <span className={`hours-counter ${available < 0 ? 'over' : ''}`}>
                                {usedHours} / {totalHours} h · {t('available') !== 'available' ? t('available') : 'disponibles'}: {available}
                            </span>
                        </div>

                        {rows.length === 0 ? (
                            <p className="wizard-hint">{t('no_subjects_in_grade') !== 'no_subjects_in_grade' ? t('no_subjects_in_grade') : 'Aún no hay asignaturas en este grado.'}</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('subj_name') !== 'subj_name' ? t('subj_name') : 'Asignatura'}</th>
                                        <th>{t('weekly_classes') !== 'weekly_classes' ? t('weekly_classes') : 'Clases/semana'}</th>
                                        <th>{t('teacher_col') !== 'teacher_col' ? t('teacher_col') : 'Profesor'}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(r => (
                                        <tr key={r.subject_id}>
                                            <td>
                                                <span className="color-dot" style={{ backgroundColor: r.color_id }}></span>
                                                <strong>{r.subject_name}</strong>
                                            </td>
                                            <td>
                                                <select value={r.weekly_hours} onChange={(e) => setHours(r.subject_id, e.target.value)} style={{ width: '70px' }}>
                                                    {hoursOptions(r).map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            </td>
                                            <td>{r.teacher_name
                                                ? r.teacher_name
                                                : <span className="opaque-text">{t('unassigned') !== 'unassigned' ? t('unassigned') : 'No asignado'}</span>}</td>
                                            <td className="table-actions">
                                                <button title={t('remove')} onClick={() => removeRow(r.subject_id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {otherGrades.length > 0 && (
                            <div style={{ borderTop: '1px solid #eee', marginTop: '18px', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-soft)' }}>
                                    {t('copy_curriculum') !== 'copy_curriculum' ? t('copy_curriculum') : 'Copiar malla de otro grado'}
                                </label>
                                <select value={copyFrom} onChange={(e) => handleCopy(e.target.value)} style={{ width: '160px' }}>
                                    <option value="">— {t('choose') !== 'choose' ? t('choose') : 'Elegir'} —</option>
                                    {otherGrades.map(g => <option key={g.grade_id} value={g.grade_id}>{g.grade_name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            {savedMsg && <span className="global-msg" style={{ color: 'var(--success)', marginRight: 'auto' }}>{savedMsg}</span>}
                            <button className="submit-btn" onClick={handleSave} disabled={saving}>
                                {saving ? '...' : (t('save_curriculum') !== 'save_curriculum' ? t('save_curriculum') : 'Guardar malla')}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Dual-list para elegir asignaturas */}
            {pickerOpen && (
                <Modal title={t('add_subject_to_grade') !== 'add_subject_to_grade' ? t('add_subject_to_grade') : 'Agregar asignaturas'} onClose={() => setPickerOpen(false)}>
                    <div className="input-group">
                        <input type="text" placeholder={t('search_subject') !== 'search_subject' ? t('search_subject') : 'Buscar asignatura'} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="picker-list">
                        {filteredAvail.length === 0 && <p className="wizard-hint">{t('no_more_subjects') !== 'no_more_subjects' ? t('no_more_subjects') : 'No hay más asignaturas disponibles.'}</p>}
                        {filteredAvail.map(s => (
                            <label key={s.subject_id} className="picker-row">
                                <input type="checkbox" checked={pendingSel.includes(s.subject_id)} onChange={() => togglePending(s.subject_id)} />
                                <span className="color-dot" style={{ backgroundColor: s.color_id }}></span>
                                <span>{s.subject_name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setPickerOpen(false)}>{t('btn_cancel')}</button>
                        <button className="submit-btn" onClick={confirmPicker} disabled={pendingSel.length === 0}>
                            {t('add_selected') !== 'add_selected' ? t('add_selected') : 'Agregar'} ({pendingSel.length})
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
}

export default Grades;