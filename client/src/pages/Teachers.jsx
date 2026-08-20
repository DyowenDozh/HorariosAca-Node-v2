// Teachers.jsx - Fase 4: profesores con ficha completa.
// Dos niveles: (1) lista de profesores; (2) ficha del profesor con materias,
// disponibilidad (D/ND/LD/LS), límite diario por día, y sub-pantalla de reglas por grado.
// La disponibilidad y reglas se GUARDAN pero el motor de generación (que las usa)
// queda pendiente para una versión posterior.
import { useState, useEffect, useMemo } from 'react';
import {
    getTeachers, createTeacher, updateTeacher, deleteTeacher,
    getSubjects, getGrades, getTeacherConfig, saveTeacherConfig, getTeacherContext
} from '../services/api';
import Modal from '../components/Modal';
import { useLanguage } from '../i18n/LanguageContext';

const DAY_KEYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

// Cuenta cuántas franjas de clase tiene cada día según la Fase 1
function hoursPerDayMap(dayMode, days, workDays) {
    const map = {};
    DAY_KEYS.forEach(k => {
        if (!workDays?.[k]) { map[k] = 0; return; }
        if (dayMode === 'uniform') map[k] = Number(days?.all?.hoursPerDay) || 0;
        else map[k] = Number(days?.[k]?.hoursPerDay) || 0;
    });
    return map;
}

// Total de horas de la semana según la Fase 1 (tope para horas/semana del profe)
function totalWeekHours(dayMode, days, workDays) {
    return ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
        .filter(k => workDays?.[k])
        .reduce((sum, k) => {
            const h = dayMode === 'uniform' ? Number(days?.all?.hoursPerDay) || 0 : Number(days?.[k]?.hoursPerDay) || 0;
            return sum + h;
        }, 0);
}

function Teachers({ scheduleId, dayMode, days, workDays }) {
    const { t } = useLanguage();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [name, setName] = useState('');
    const [hours, setHours] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [cardTeacher, setCardTeacher] = useState(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getTeachers(scheduleId);
            setTeachers(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar profesores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setName(''); setHours(''); setFormOpen(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await createTeacher(name, Number(hours) || 0, scheduleId);
            setFormOpen(false);
            await load();
            const newId = res?.data?.teacher_id;
            if (newId) setCardTeacher({ teacher_id: newId, teacher_name: name, amount_hour: Number(hours) || 0 });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteTeacher(deleteTarget.teacher_id);
            setDeleteTarget(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar');
        }
    };

    if (cardTeacher) {
        return (
            <TeacherCard
                teacher={cardTeacher}
                scheduleId={scheduleId}
                dayMode={dayMode} days={days} workDays={workDays}
                onBack={() => { setCardTeacher(null); load(); }}
                t={t}
            />
        );
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>{t('teachers_title') !== 'teachers_title' ? t('teachers_title') : 'Gestión de Profesores'}</h1>
            </div>

            <section className="table-container">
                {loading && <p className="loading-text">{t('loading')}</p>}
                {error && <p className="error-msg" style={{ display: 'block' }}>{error}</p>}

                {!loading && !error && teachers.length === 0 && (
                    <div className="empty-state">
                        <p className="opaque-text">{t('teachers_empty') !== 'teachers_empty' ? t('teachers_empty') : 'No hay profesores. Usa el botón para crear uno.'}</p>
                    </div>
                )}

                {!loading && !error && teachers.length > 0 && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('teacher_name_col') !== 'teacher_name_col' ? t('teacher_name_col') : 'Profesor'}</th>
                                <th>{t('teacher_hours_col') !== 'teacher_hours_col' ? t('teacher_hours_col') : 'Horas/semana'}</th>
                                <th>{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map(tc => (
                                <tr key={tc.teacher_id}>
                                    <td>#{tc.teacher_id}</td>
                                    <td><strong>{tc.teacher_name}</strong></td>
                                    <td>{tc.amount_hour} h</td>
                                    <td className="table-actions">
                                        <button title={t('teacher_config') !== 'teacher_config' ? t('teacher_config') : 'Configurar'} onClick={() => setCardTeacher(tc)}>⚙️</button>
                                        <button title={t('remove')} onClick={() => setDeleteTarget(tc)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <button className="add-inline-btn" onClick={openCreate}>
                    <span>+</span> {t('teacher_add') !== 'teacher_add' ? t('teacher_add') : 'Nuevo profesor'}
                </button>
            </section>

            {formOpen && (
                <Modal title={t('teacher_add') !== 'teacher_add' ? t('teacher_add') : 'Nuevo profesor'} onClose={() => setFormOpen(false)}>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>{t('teacher_name_col') !== 'teacher_name_col' ? t('teacher_name_col') : 'Nombre del profesor'}</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Pérez" required />
                        </div>
                        <div className="input-group">
                            <label>{t('teacher_hours_label') !== 'teacher_hours_label' ? t('teacher_hours_label') : 'Horas por semana'}</label>
                            <input type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Ej: 20" required />
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
                        ¿Seguro que deseas eliminar al profesor <strong>{deleteTarget.teacher_name}</strong>? Esta acción no se puede deshacer.
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

/* ---------- Ficha completa del profesor ---------- */
function TeacherCard({ teacher, scheduleId, dayMode, days, workDays, onBack, t }) {
    const [allSubjects, setAllSubjects] = useState([]);
    const [allGrades, setAllGrades] = useState([]);
    const [teacherName, setTeacherName] = useState(teacher.teacher_name);
    const [weekHours, setWeekHours] = useState(teacher.amount_hour || 0);
    const [editingName, setEditingName] = useState(false);

    const [subjectIds, setSubjectIds] = useState([]);      // materias que imparte
    const [ndCells, setNdCells] = useState(new Set());     // "day-hour" marcadas ND
    const [dayLimits, setDayLimits] = useState({});        // { lun: 5, mar: 4, ... }
    const [rules, setRules] = useState({});                // { "subjectId-gradeId": 'PODRA'|'DEBE'|'NO' }

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    const [pickerOpen, setPickerOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [pendingSel, setPendingSel] = useState([]);
    const [showGradeRules, setShowGradeRules] = useState(false);

    const hpd = useMemo(() => hoursPerDayMap(dayMode, days, workDays), [dayMode, days, workDays]);
    const activeDays = DAY_KEYS.filter(k => workDays?.[k]);
    const maxHours = Math.max(0, ...activeDays.map(k => hpd[k]));
    const weekTotal = useMemo(() => totalWeekHours(dayMode, days, workDays), [dayMode, days, workDays]);

    // Contexto: horas de mallas y grados ya tomados por otros profes (DEBE)
    const [mallas, setMallas] = useState([]);   // [{grade_id, subject_id, weekly_hours}]
    const [taken, setTaken] = useState([]);      // [{subject_id, grade_id, teacher_name}]

    const load = async () => {
        setLoading(true); setError('');
        try {
            const subsRes = await getSubjects(scheduleId);
            setAllSubjects(subsRes.data || []);
            const grRes = await getGrades(scheduleId);
            setAllGrades(grRes.data || []);
            const cfgRes = await getTeacherConfig(teacher.teacher_id);
            const cfg = cfgRes.data || {};
            setSubjectIds((cfg.subjects || []).map(s => s.subject_id));
            const nd = new Set();
            (cfg.availability || []).forEach(a => { if (a.status === 'ND') nd.add(`${a.day_key}-${a.hour_index}`); });
            setNdCells(nd);
            const dl = {};
            (cfg.dayLimits || []).forEach(d => { dl[d.day_key] = d.max_hours; });
            setDayLimits(dl);
            const rl = {};
            (cfg.rules || []).forEach(r => { rl[`${r.subject_id}-${r.grade_id}`] = r.rule; });
            setRules(rl);

            // Contexto para contador de horas y bloqueo de grados tomados
            const ctxRes = await getTeacherContext(scheduleId, teacher.teacher_id);
            setMallas(ctxRes.data?.mallas || []);
            setTaken(ctxRes.data?.taken || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar la configuración');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const saveName = async () => {
        const trimmed = teacherName.trim();
        if (!trimmed) { setTeacherName(teacher.teacher_name); setEditingName(false); return; }
        try {
            await updateTeacher(teacher.teacher_id, trimmed, Number(weekHours) || 0);
            teacher.teacher_name = trimmed;
            setEditingName(false);
        } catch { setError('Error al renombrar'); }
    };

    // Materias del profesor (para el dual-list)
    const mySubjects = allSubjects.filter(s => subjectIds.includes(s.subject_id));
    const notMine = allSubjects.filter(s => !subjectIds.includes(s.subject_id));
    const filteredAvail = notMine.filter(s => s.subject_name.toLowerCase().includes(search.toLowerCase()));

    const openPicker = () => { setPendingSel([]); setSearch(''); setPickerOpen(true); };
    const togglePending = (id) => setPendingSel(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
    const confirmPicker = () => { setSubjectIds(prev => [...prev, ...pendingSel]); setPickerOpen(false); };
    const removeSubject = (id) => setSubjectIds(prev => prev.filter(x => x !== id));

    // Estado de una celda: solo 'D' (disponible) o 'ND' (bloqueada manualmente).
    // Los límites diario (LD) y semanal (LS) se guardan como datos y los usará el
    // generador de horario más adelante; aquí no se pintan para no confundir.
    const cellStatus = (dayKey, hourIdx) => {
        return ndCells.has(`${dayKey}-${hourIdx}`) ? 'ND' : 'D';
    };

    const toggleCell = (dayKey, hourIdx) => {
        const key = `${dayKey}-${hourIdx}`;
        setNdCells(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    // Horas asignadas OBLIGATORIAMENTE (suma de horas de malla por cada regla DEBE)
    const mallaHours = (subjectId, gradeId) => {
        const m = mallas.find(x => x.subject_id === Number(subjectId) && x.grade_id === Number(gradeId));
        return m ? Number(m.weekly_hours) || 0 : 0;
    };
    const obligatoryHours = useMemo(() => {
        return Object.entries(rules).reduce((sum, [k, rule]) => {
            if (rule !== 'DEBE') return sum;
            const [subjectId, gradeId] = k.split('-');
            return sum + mallaHours(subjectId, gradeId);
        }, 0);
    }, [rules, mallas]);
    const overLimit = obligatoryHours > (Number(weekHours) || 0);

    const handleSave = async () => {
        if (overLimit) {
            setError((t('over_limit_msg') !== 'over_limit_msg' ? t('over_limit_msg') : 'Las horas obligatorias superan el límite semanal del profesor. Ajusta antes de guardar.'));
            return;
        }
        setSaving(true); setSavedMsg(''); setError('');
        const availability = [...ndCells].map(k => {
            const [day_key, hour_index] = k.split('-');
            return { day_key, hour_index: Number(hour_index), status: 'ND' };
        });
        const dayLimitsArr = Object.entries(dayLimits).map(([day_key, max_hours]) => ({ day_key, max_hours }));
        const rulesArr = Object.entries(rules).map(([k, rule]) => {
            const [subject_id, grade_id] = k.split('-');
            return { subject_id: Number(subject_id), grade_id: Number(grade_id), rule };
        });
        try {
            // Guarda también nombre/horas por si cambiaron
            await updateTeacher(teacher.teacher_id, teacherName.trim(), Number(weekHours) || 0);
            await saveTeacherConfig(teacher.teacher_id, {
                subjectIds, availability, dayLimits: dayLimitsArr, rules: rulesArr,
            });
            setSavedMsg(t('teacher_saved') !== 'teacher_saved' ? t('teacher_saved') : 'Profesor guardado.');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const dayLabels = { lun: t('day_mon'), mar: t('day_tue'), mie: t('day_wed'), jue: t('day_thu'), vie: t('day_fri'), sab: t('day_sat'), dom: t('day_sun') };
    const statusStyle = {
        D:  { bg: '#E1F5EE', color: '#0F6E56', label: 'D' },
        ND: { bg: '#FCEBEB', color: '#A32D2D', label: 'ND' },
        LD: { bg: '#FAEEDA', color: '#854F0B', label: 'LD' },
        LS: { bg: '#FBEAF0', color: '#993556', label: 'LS' },
    };

    // Sub-pantalla de reglas por grado
    if (showGradeRules) {
        return (
            <GradeRules
                teacher={teacher} mySubjects={mySubjects} allGrades={allGrades}
                rules={rules} setRules={setRules} taken={taken} mallas={mallas}
                weekHours={Number(weekHours) || 0}
                onBack={() => setShowGradeRules(false)} t={t}
            />
        );
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>
                    {editingName ? (
                        <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)}
                            onBlur={saveName} onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }} autoFocus
                            style={{ fontSize: '1rem', padding: '4px 8px', width: '200px' }} />
                    ) : (
                        <>{teacher.teacher_name}
                            <button className="link-btn" style={{ marginLeft: '8px', fontSize: '0.9rem' }} onClick={() => { setTeacherName(teacher.teacher_name); setEditingName(true); }}>✏️</button>
                        </>
                    )}
                </h1>
                <button className="link-btn" onClick={onBack}>← {t('teachers_back') !== 'teachers_back' ? t('teachers_back') : 'Volver a profesores'}</button>
            </div>

            <div className="settings-card" style={{ maxWidth: '820px', margin: '0 auto' }}>
                {loading && <p className="loading-text">{t('loading')}</p>}
                {error && <p className="error-msg" style={{ display: 'block' }}>{error}</p>}

                {!loading && (
                    <>
                        {/* Horas / semana */}
                        <div className="input-group" style={{ maxWidth: '300px' }}>
                            <label>{t('teacher_hours_ls') !== 'teacher_hours_ls' ? t('teacher_hours_ls') : 'Horas/semana (límite LS)'}{weekTotal > 0 ? ` · máx ${weekTotal}` : ''}</label>
                            <input type="number" min="0" max={weekTotal || undefined} value={weekHours}
                                onChange={(e) => {
                                    let v = Number(e.target.value) || 0;
                                    if (weekTotal > 0 && v > weekTotal) v = weekTotal;
                                    setWeekHours(v);
                                }} />
                        </div>

                        {/* Materias que imparte */}
                        <label className="p1-label" style={{ marginTop: '10px' }}>{t('teacher_subjects') !== 'teacher_subjects' ? t('teacher_subjects') : 'Asignaturas que imparte'}</label>
                        {allSubjects.length === 0 ? (
                            <p className="wizard-hint">{t('no_subjects_first') !== 'no_subjects_first' ? t('no_subjects_first') : 'Primero crea materias en la Fase 2.'}</p>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                {mySubjects.map(s => (
                                    <span key={s.subject_id} className="subject-chip">
                                        <span className="color-dot" style={{ backgroundColor: s.color_id }}></span>
                                        {s.subject_name}
                                        <button onClick={() => removeSubject(s.subject_id)} title={t('remove')}>×</button>
                                    </span>
                                ))}
                                <button className="add-break-btn" onClick={openPicker} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                                    + {t('add_subject_to_grade') !== 'add_subject_to_grade' ? t('add_subject_to_grade') : 'Agregar asignatura'}
                                </button>
                            </div>
                        )}

                        {/* Disponibilidad */}
                        <label className="p1-label" style={{ marginTop: '18px' }}>{t('availability') !== 'availability' ? t('availability') : 'Disponibilidad semanal'}</label>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: 'var(--text-soft)', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span><b style={{ color: '#0F6E56' }}>D</b> {t('avail_d') !== 'avail_d' ? t('avail_d') : 'disponible'}</span>
                            <span><b style={{ color: '#A32D2D' }}>ND</b> {t('avail_nd') !== 'avail_nd' ? t('avail_nd') : 'no disponible'}</span>
                            <span style={{ color: 'var(--text-soft)' }}>· {t('avail_hint') !== 'avail_hint' ? t('avail_hint') : 'clic en una celda para bloquear esa hora'}</span>
                        </div>

                        {activeDays.length === 0 || maxHours === 0 ? (
                            <p className="wizard-hint">{t('avail_need_phase1') !== 'avail_need_phase1' ? t('avail_need_phase1') : 'Configura primero la estructura en la Fase 1.'}</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="avail-table">
                                    <thead>
                                        <tr>
                                            <th>{t('hour_word')}</th>
                                            {activeDays.map(dk => <th key={dk}>{dayLabels[dk]}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: maxHours }).map((_, hourIdx) => (
                                            <tr key={hourIdx}>
                                                <td className="avail-hour">{hourIdx + 1}</td>
                                                {activeDays.map(dk => {
                                                    if (hourIdx >= hpd[dk]) return <td key={dk}></td>;
                                                    const st = cellStatus(dk, hourIdx);
                                                    const sty = statusStyle[st];
                                                    const clickable = st === 'D' || st === 'ND';
                                                    return (
                                                        <td key={dk}>
                                                            <button
                                                                className="avail-cell"
                                                                style={{ background: sty.bg, color: sty.color, cursor: clickable ? 'pointer' : 'default' }}
                                                                onClick={() => clickable && toggleCell(dk, hourIdx)}
                                                                disabled={!clickable}
                                                            >{sty.label}</button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        {/* Fila de límite diario */}
                                        <tr>
                                            <td className="avail-hour" style={{ fontSize: '0.7rem' }}>{t('day_limit') !== 'day_limit' ? t('day_limit') : 'Límite día'}</td>
                                            {activeDays.map(dk => (
                                                <td key={dk}>
                                                    <select value={dayLimits[dk] || 0} onChange={(e) => setDayLimits(prev => ({ ...prev, [dk]: Number(e.target.value) }))} style={{ width: '54px' }}>
                                                        <option value={0}>—</option>
                                                        {Array.from({ length: hpd[dk] }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                                    </select>
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Contador de horas obligatorias */}
                        {mySubjects.length > 0 && allGrades.length > 0 && (
                            <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <span className={`hours-counter ${overLimit ? 'over' : ''}`}>
                                    {t('obligatory_hours') !== 'obligatory_hours' ? t('obligatory_hours') : 'Horas obligatorias'}: {obligatoryHours} / {Number(weekHours) || 0}
                                </span>
                                {overLimit && <span style={{ color: '#A32D2D', fontSize: '0.82rem' }}>{t('over_limit_short') !== 'over_limit_short' ? t('over_limit_short') : '¡Supera el límite semanal!'}</span>}
                            </div>
                        )}

                        {/* Asignación a grados */}
                        {mySubjects.length > 0 && allGrades.length > 0 && (
                            <button className="add-inline-btn" style={{ marginTop: '12px', background: 'var(--surface)', color: 'var(--primary)', border: '1.5px solid var(--primary)' }} onClick={() => setShowGradeRules(true)}>
                                {t('assign_grades') !== 'assign_grades' ? t('assign_grades') : 'Asignación a grados'} →
                            </button>
                        )}

                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            {savedMsg && <span className="global-msg" style={{ color: 'var(--success)', marginRight: 'auto' }}>{savedMsg}</span>}
                            <button className="submit-btn" onClick={handleSave} disabled={saving}>
                                {saving ? '...' : (t('save_teacher') !== 'save_teacher' ? t('save_teacher') : 'Guardar profesor')}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {pickerOpen && (
                <Modal title={t('teacher_subjects') !== 'teacher_subjects' ? t('teacher_subjects') : 'Agregar asignaturas'} onClose={() => setPickerOpen(false)}>
                    <div className="input-group">
                        <input type="text" placeholder={t('search_subject') !== 'search_subject' ? t('search_subject') : 'Buscar asignatura'} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="picker-list">
                        {filteredAvail.length === 0 && <p className="wizard-hint">{t('no_more_subjects') !== 'no_more_subjects' ? t('no_more_subjects') : 'No hay más asignaturas.'}</p>}
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
                        <button className="submit-btn" onClick={confirmPicker} disabled={pendingSel.length === 0}>{t('add_selected') !== 'add_selected' ? t('add_selected') : 'Agregar'} ({pendingSel.length})</button>
                    </div>
                </Modal>
            )}
        </>
    );
}

/* ---------- Sub-pantalla: reglas por grado (PODRA/DEBE/NO) ---------- */
function GradeRules({ teacher, mySubjects, allGrades, rules, setRules, taken, mallas, weekHours, onBack, t }) {
    const [activeSubject, setActiveSubject] = useState(mySubjects[0]?.subject_id || null);
    // Modal de confirmación al cambiar un grado tomado por otro profe
    const [confirmChange, setConfirmChange] = useState(null); // {subjectId, gradeId, value, teacherName}

    // ¿Este grado-materia lo tiene otro profe como DEBE?
    const takenBy = (subjectId, gradeId) => {
        const hit = (taken || []).find(x => x.subject_id === Number(subjectId) && x.grade_id === Number(gradeId));
        return hit ? hit.teacher_name : null;
    };

    const setRule = (subjectId, gradeId, value) => {
        setRules(prev => ({ ...prev, [`${subjectId}-${gradeId}`]: value }));
    };
    // Regla efectiva: si está tomado por otro y no hay valor propio, se muestra NO
    const getRule = (subjectId, gradeId) => {
        const own = rules[`${subjectId}-${gradeId}`];
        if (own) return own;
        if (takenBy(subjectId, gradeId)) return 'NO';
        return 'PODRA';
    };

    const handleChange = (subjectId, gradeId, value) => {
        const who = takenBy(subjectId, gradeId);
        // Si está tomado por otro y se intenta cambiar a algo distinto de NO → confirmar
        if (who && value !== 'NO') {
            setConfirmChange({ subjectId, gradeId, value, teacherName: who });
            return;
        }
        setRule(subjectId, gradeId, value);
    };

    const confirmYes = () => {
        if (confirmChange) setRule(confirmChange.subjectId, confirmChange.gradeId, confirmChange.value);
        setConfirmChange(null);
    };

    // Horas obligatorias de la materia activa (para mostrar por fila)
    const mallaHours = (subjectId, gradeId) => {
        const m = (mallas || []).find(x => x.subject_id === Number(subjectId) && x.grade_id === Number(gradeId));
        return m ? Number(m.weekly_hours) || 0 : 0;
    };
    const obligatoryHours = Object.entries(rules).reduce((sum, [k, rule]) => {
        if (rule !== 'DEBE') return sum;
        const [sid, gid] = k.split('-');
        return sum + mallaHours(sid, gid);
    }, 0);
    const overLimit = obligatoryHours > weekHours;

    return (
        <>
            <div className="dashboard-header">
                <h1>{t('assign_grades') !== 'assign_grades' ? t('assign_grades') : 'Asignación a grados'} · {teacher.teacher_name}</h1>
                <button className="link-btn" onClick={onBackGuard(onBack, overLimit, t)}>← {t('back_word') !== 'back_word' ? t('back_word') : 'Volver'}</button>
            </div>

            <div className="settings-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <p className="wizard-hint" style={{ margin: 0 }}>{t('grade_rules_hint') !== 'grade_rules_hint' ? t('grade_rules_hint') : 'Para cada asignatura, indica en qué grados este profesor podrá, deberá o no impartirá.'}</p>
                    <span className={`hours-counter ${overLimit ? 'over' : ''}`}>
                        {t('obligatory_hours') !== 'obligatory_hours' ? t('obligatory_hours') : 'Horas obligatorias'}: {obligatoryHours} / {weekHours}
                    </span>
                </div>

                {/* Pestañas por materia */}
                <div className="day-tabs" style={{ marginBottom: '18px' }}>
                    {mySubjects.map(s => (
                        <button key={s.subject_id} className={activeSubject === s.subject_id ? 'active' : ''} onClick={() => setActiveSubject(s.subject_id)}>
                            {s.subject_name}
                        </button>
                    ))}
                </div>

                {allGrades.length === 0 ? (
                    <p className="wizard-hint">{t('no_grades_yet') !== 'no_grades_yet' ? t('no_grades_yet') : 'No hay grados creados en la Fase 3.'}</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('grade_name_col') !== 'grade_name_col' ? t('grade_name_col') : 'Grado'}</th>
                                <th>{t('rule_col') !== 'rule_col' ? t('rule_col') : 'Regla'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allGrades.map(g => {
                                const who = takenBy(activeSubject, g.grade_id);
                                const rule = getRule(activeSubject, g.grade_id);
                                const hrs = mallaHours(activeSubject, g.grade_id);
                                return (
                                    <tr key={g.grade_id} style={who && rule === 'NO' ? { opacity: 0.55 } : undefined}>
                                        <td>
                                            <strong>{g.grade_name}</strong>
                                            {hrs > 0 && <span className="opaque-text" style={{ marginLeft: '6px', fontSize: '0.8rem' }}>({hrs}h)</span>}
                                            {who && <div style={{ fontSize: '0.72rem', color: '#A32D2D' }}>{(t('taken_by') !== 'taken_by' ? t('taken_by') : 'Asignado a')}: {who}</div>}
                                        </td>
                                        <td>
                                            <select value={rule} onChange={(e) => handleChange(activeSubject, g.grade_id, e.target.value)} style={{ width: '100%', maxWidth: '320px' }}>
                                                <option value="PODRA">{t('rule_podra') !== 'rule_podra' ? t('rule_podra') : 'Podrá impartir (por defecto)'}</option>
                                                <option value="DEBE">{t('rule_debe') !== 'rule_debe' ? t('rule_debe') : 'Impartirá OBLIGATORIAMENTE'}</option>
                                                <option value="NO">{t('rule_no') !== 'rule_no' ? t('rule_no') : 'NO impartirá'}</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                <div className="modal-actions" style={{ marginTop: '18px' }}>
                    {overLimit && <span style={{ color: '#A32D2D', fontSize: '0.82rem', marginRight: 'auto' }}>{t('over_limit_short') !== 'over_limit_short' ? t('over_limit_short') : '¡Supera el límite semanal!'}</span>}
                    <button className="submit-btn" onClick={onBack}>{t('done_word') !== 'done_word' ? t('done_word') : 'Listo'}</button>
                </div>
            </div>

            {/* Modal: confirmar cambio de grado ya tomado por otro profe */}
            {confirmChange && (
                <Modal title={t('taken_title') !== 'taken_title' ? t('taken_title') : 'Grado ya asignado'} onClose={() => setConfirmChange(null)}>
                    <p className="confirm-text">
                        {(t('taken_text1') !== 'taken_text1' ? t('taken_text1') : 'El profesor')} <strong>{confirmChange.teacherName}</strong> {(t('taken_text2') !== 'taken_text2' ? t('taken_text2') : 'ya tiene este grado asignado obligatoriamente para esta materia. ¿Deseas asignarlo también a este profesor?')}
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setConfirmChange(null)}>{t('btn_cancel')}</button>
                        <button className="btn-danger" onClick={confirmYes}>{t('taken_confirm') !== 'taken_confirm' ? t('taken_confirm') : 'Sí, asignar de todos modos'}</button>
                    </div>
                </Modal>
            )}
        </>
    );
}

// Evita salir si se pasó del límite (bloquea el volver con aviso)
function onBackGuard(onBack, overLimit, t) {
    return () => {
        if (overLimit) {
            alert(t('over_limit_msg') !== 'over_limit_msg' ? t('over_limit_msg') : 'Las horas obligatorias superan el límite semanal del profesor. Ajusta antes de continuar.');
            return;
        }
        onBack();
    };
}

export default Teachers;