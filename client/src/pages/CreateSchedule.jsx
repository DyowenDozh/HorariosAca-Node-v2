// CreateSchedule.jsx - Asistente de creación/edición de horario en 6 fases.
// Cada horario aísla sus materias/grados/profesores mediante schedule_id.
// Al crear NUEVO: se genera un borrador (is_draft=1) para obtener el id de una
// vez; las fases 2/3/4 guardan sus datos ligados a ese id. Al finalizar, el
// borrador se marca como definitivo. Si se cancela vacío, se descarta.
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import Modal from '../components/Modal';
import Subjects from './Subjects';
import Grades from './Grades';
import Teachers from './Teachers';
import { Phase1DayConfig, defaultDay } from './Phase1DayConfig';
import { setExitToList, clearExitToList } from '../utils/navGuard';
import {
    getScheduleById, updateSchedule, createDraft, draftHasData,
    finalizeSchedule, deleteSchedulePermanent, getPrefDetails, savePrefDetails,
    generateSchedule, getGeneratedSchedule
} from '../services/api';

const TOTAL_PHASES = 6;

function CreateSchedule({ onBack, editingId }) {
    const { t } = useLanguage();
    const [phase, setPhase] = useState(1);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // id del horario en el que trabajamos (borrador nuevo o el que se edita)
    const [activeId, setActiveId] = useState(editingId || null);
    const activeIdRef = useRef(editingId || null);
    const isEditing = !!editingId; // true si se abrió para editar uno existente

    const [name, setName] = useState('');
    const [general, setGeneral] = useState({
        institution: '', schoolYear: '', period: 'semestre', journey: 'mañana',
    });
    const [workDays, setWorkDays] = useState(
        { lun: true, mar: true, mie: true, jue: true, vie: true, sab: false, dom: false }
    );
    const toggleWorkDay = (d) => setWorkDays(w => ({ ...w, [d]: !w[d] }));
    const [dayMode, setDayMode] = useState('uniform');
    const [days, setDays] = useState({
        all: defaultDay(),
        lun: defaultDay(), mar: defaultDay(), mie: defaultDay(),
        jue: defaultDay(), vie: defaultDay(), sab: defaultDay(), dom: defaultDay(),
    });
    const [prefs, setPrefs] = useState({
        noRepeatSameDay: true, groupTwoHours: false, avoidThreeInRow: true,
        areaMeeting: false, avoidNoBreak: true,
    });

    const savedSnapshot = useRef('');
    const [pendingAction, setPendingAction] = useState(null);
    // Modal al salir de un borrador con datos
    const [draftExitPrompt, setDraftExitPrompt] = useState(false);
    // Modal al pulsar "Siguiente" en la fase de Grados (fase 3)
    const [gradeContinuePrompt, setGradeContinuePrompt] = useState(false);
    // para que módulo de Grados abra el formulario de "Nuevo grado"
    const [newGradeSignal, setNewGradeSignal] = useState(0);

    const currentSnapshot = () => JSON.stringify({ name, general, dayMode, workDays, days, prefs });

    // Al montar: si es NUEVO, crear un borrador para obtener su id
    useEffect(() => {
        (async () => {
            if (editingId) {
                // Cargar horario existente
                try {
                    const res = await getScheduleById(editingId);
                    const s = res.data;
                    setName(s.name || '');
                    setGeneral({
                        institution: s.institution || '', schoolYear: s.school_year || '',
                        period: 'semestre', journey: s.journey || 'mañana',
                    });
                    setDayMode(s.day_mode || 'uniform');
                    const newDays = {
                        all: defaultDay(),
                        lun: defaultDay(), mar: defaultDay(), mie: defaultDay(),
                        jue: defaultDay(), vie: defaultDay(), sab: defaultDay(), dom: defaultDay(),
                    };
                    const newWork = { lun: false, mar: false, mie: false, jue: false, vie: false, sab: false, dom: false };
                    (s.days || []).forEach(d => {
                        newDays[d.day_key] = {
                            hoursPerDay: d.hours_per_day, classH: d.class_h, classM: d.class_m,
                            startH: d.start_h, startM: d.start_m, startAP: d.start_ap,
                            breaks: (d.breaks || []).map(b => ({ id: b.break_id, afterHour: b.after_hour, minutes: b.minutes })),
                        };
                        if (d.day_key !== 'all' && d.is_working) newWork[d.day_key] = true;
                    });
                    setDays(newDays);
                    const loadedWork = Object.values(newWork).some(Boolean)
                        ? newWork
                        : { lun: true, mar: true, mie: true, jue: true, vie: true, sab: false, dom: false };
                    setWorkDays(loadedWork);
                    const loadedPrefs = s.prefs ? {
                        noRepeatSameDay: !!s.prefs.no_repeat_same_day,
                        groupTwoHours: !!s.prefs.group_two_hours,
                        avoidThreeInRow: !!s.prefs.avoid_three_in_row,
                        areaMeeting: !!s.prefs.area_meeting,
                        avoidNoBreak: !!s.prefs.avoid_no_break,
                    } : prefs;
                    if (s.prefs) setPrefs(loadedPrefs);
                    savedSnapshot.current = JSON.stringify({
                        name: s.name || '',
                        general: { institution: s.institution || '', schoolYear: s.school_year || '', period: 'semestre', journey: s.journey || 'mañana' },
                        dayMode: s.day_mode || 'uniform',
                        workDays: loadedWork, days: newDays, prefs: loadedPrefs,
                    });
                } catch {
                    setSaveError(t('schedule_load_error'));
                }
            } else {
                // Crear borrador nuevo para obtener id
                try {
                    const res = await createDraft();
                    const id = res?.data?.schedule_id;
                    if (id) { setActiveId(id); activeIdRef.current = id; }
                    savedSnapshot.current = currentSnapshot();
                } catch {
                    setSaveError(t('schedule_save_error'));
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingId]);

    const isDirty = () => savedSnapshot.current !== currentSnapshot();

    // Registra la salida del editor para que el botón "Gestión" del sidebar
    // haga lo mismo que "Volver a la lista".
    const goBackRef = useRef(null);
    useEffect(() => {
        setExitToList(() => { if (goBackRef.current) goBackRef.current(); });
        return () => clearExitToList();
    }, []);

    const guardedGo = (action) => {
        if (isDirty()) setPendingAction(() => action);
        else action();
    };

    const next = () => {
        // En la fase de Grados, preguntar si añadir otro grado o pasar a Profesores
        if (phase === 3) { setGradeContinuePrompt(true); return; }
        guardedGo(() => setPhase(p => Math.min(TOTAL_PHASES, p + 1)));
    };
    const prev = () => guardedGo(() => setPhase(p => Math.max(1, p - 1)));

    // Volver a la lista: si es un borrador (nuevo) sin nombre/datos, decidir si descartar
    const goBackToList = async () => {
        if (isDirty()) { setPendingAction(() => reallyExit); return; }
        await reallyExit();
    };
    goBackRef.current = goBackToList; // mantiene la salida del sidebar actualizada

    // Sale del wizard, si es un borrador nuevo, decide descartar o preguntar
    const reallyExit = async () => {
        if (!isEditing && activeIdRef.current) {
            try {
                const res = await draftHasData(activeIdRef.current);
                if (!res.hasData && !name.trim()) {
                    // Borrador vacío → descartar en silencio
                    await deleteSchedulePermanent(activeIdRef.current);
                    onBack(false);
                    return;
                }
                // Borrador con datos → preguntar
                setDraftExitPrompt(true);
                return;
            } catch {
                onBack(false);
                return;
            }
        }
        onBack(false);
    };

    // Guarda (actualiza el borrador/horario ya existente)
    const persist = async () => {
        if (!name.trim()) {
            setPhase(1);
            setSaveError(t('schedule_name_required'));
            return false;
        }
        if (!activeIdRef.current) { setSaveError(t('schedule_save_error')); return false; }
        setSaving(true);
        setSaveError('');
        const payload = { name: name.trim(), general, dayMode, workDays, days, prefs };
        try {
            await updateSchedule(activeIdRef.current, payload);
            savedSnapshot.current = currentSnapshot();
            return true;
        } catch (err) {
            setSaveError(err.response?.data?.message || t('schedule_save_error'));
            return false;
        } finally {
            setSaving(false);
        }
    };

    // --- Modal cambios sin guardar ---
    const modalSave = async () => {
        const ok = await persist();
        if (ok && pendingAction) { const a = pendingAction; setPendingAction(null); a(); }
        else if (!ok) setPendingAction(null);
    };
    const modalDiscard = () => {
        savedSnapshot.current = currentSnapshot();
        if (pendingAction) { const a = pendingAction; setPendingAction(null); a(); }
    };
    const modalCancel = () => setPendingAction(null);

    // --- Modal salir de borrador con datos ---
    const draftSaveAsDraft = async () => {
        // Guarda el nombre/config del borrador pero lo deja como borrador (is_draft=1)
        if (name.trim() && activeIdRef.current) {
            const payload = { name: name.trim(), general, dayMode, workDays, days, prefs };
            try { await updateSchedule(activeIdRef.current, payload); } catch { /* ignore */ }
        }
        setDraftExitPrompt(false);
        onBack(true);
    };
    const draftDiscardAll = async () => {
        if (activeIdRef.current) {
            try { await deleteSchedulePermanent(activeIdRef.current); } catch { /* ignore */ }
        }
        setDraftExitPrompt(false);
        onBack(true);
    };

    // Finalizar: guarda y marca como definitivo
    const handleFinish = async () => {
        const ok = await persist();
        if (!ok) return;
        try {
            if (!isEditing) await finalizeSchedule(activeIdRef.current);
        } catch { /* ignore */ }
        onBack(true);
    };

    const phaseTitles = [
        t('phase1_title'), t('phase2_title'), t('phase3_title'),
        t('phase4_title'), t('phase5_title'), t('phase6_title'),
    ];

    return (
        <>
            <div className="dashboard-header">
                <h1>{isEditing ? t('edit_schedule_title') : t('create_schedule_title')}</h1>
                <button className="link-btn" onClick={goBackToList}>← {t('back_to_list')}</button>
            </div>

            <div className="wizard-steps">
                {phaseTitles.map((title, i) => {
                    const n = i + 1;
                    const state = n === phase ? 'active' : (n < phase ? 'done' : '');
                    return (
                        <div className={`wizard-step ${state}`} key={n} onClick={() => guardedGo(() => setPhase(n))}>
                            <div className="wizard-step-num">{n < phase ? '✓' : n}</div>
                            <div className="wizard-step-label">{title}</div>
                        </div>
                    );
                })}
            </div>

            <div className="wizard-body">
                {phase === 1 && (
                    <>
                        <div className="settings-card" style={{ maxWidth: '640px', margin: '0 auto 20px' }}>
                            <div className="input-group">
                                <label>{t('schedule_name')}</label>
                                <input type="text" value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('schedule_name_ph')} />
                            </div>
                            <div className="input-group">
                                <label>{t('phase1_institution')}</label>
                                <input type="text" value={general.institution}
                                    onChange={(e) => setGeneral(g => ({ ...g, institution: e.target.value }))}
                                    placeholder="Ej: I.E. José Hilario López" />
                            </div>
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                <div className="input-group" style={{ flex: 1, minWidth: '160px' }}>
                                    <label>{t('phase1_year')}</label>
                                    <input type="text" value={general.schoolYear}
                                        onChange={(e) => setGeneral(g => ({ ...g, schoolYear: e.target.value }))}
                                        placeholder="2026" />
                                </div>
                                <div className="input-group" style={{ flex: 1, minWidth: '160px' }}>
                                    <label>{t('phase1_journey')}</label>
                                    <select value={general.journey}
                                        onChange={(e) => setGeneral(g => ({ ...g, journey: e.target.value }))}>
                                        <option value="mañana">{t('journey_morning')}</option>
                                        <option value="tarde">{t('journey_afternoon')}</option>
                                        <option value="noche">{t('journey_night')}</option>
                                        <option value="completa">{t('journey_full')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <Phase1DayConfig
                            mode={dayMode} setMode={setDayMode}
                            days={days} setDays={setDays}
                            workDays={workDays} setWorkDays={setWorkDays}
                            toggleWorkDay={toggleWorkDay}
                        />
                    </>
                )}
                {phase === 2 && (
                    <div className="wizard-phase-wrap"><p className="wizard-hint">{t('phase2_hint')}</p><Subjects scheduleId={activeId} /></div>
                )}
                {phase === 3 && (
                    <div className="wizard-phase-wrap"><p className="wizard-hint">{t('phase3_hint')}</p><Grades scheduleId={activeId} dayMode={dayMode} days={days} workDays={workDays} newGradeSignal={newGradeSignal} /></div>
                )}
                {phase === 4 && (
                    <div className="wizard-phase-wrap"><p className="wizard-hint">{t('phase4_hint')}</p><Teachers scheduleId={activeId} dayMode={dayMode} days={days} workDays={workDays} /></div>
                )}
                {phase === 5 && <Phase5 prefs={prefs} setPrefs={setPrefs} scheduleId={activeId} t={t} />}
                {phase === 6 && <Phase6 scheduleId={activeId} dayMode={dayMode} days={days} workDays={workDays} t={t} />}
            </div>

            {saveError && <p className="global-msg bad" style={{ marginBottom: '10px' }}>{saveError}</p>}

            <div className="wizard-nav">
                <button className="btn-secondary" onClick={prev} disabled={phase === 1}>
                    ← {t('wizard_prev')}
                </button>
                {phase < TOTAL_PHASES ? (
                    <button className="submit-btn wizard-next" onClick={next}>
                        {t('wizard_next')} →
                    </button>
                ) : (
                    <button className="submit-btn wizard-next" onClick={handleFinish} disabled={saving}>
                        {saving ? '...' : (isEditing ? t('settings_save') : t('wizard_finish'))}
                    </button>
                )}
            </div>

            {/* Modal añadir otro grado o continuar a Profesores? */}
            {gradeContinuePrompt && (
                <Modal title="Grados" onClose={() => setGradeContinuePrompt(false)}>
                    <p className="confirm-text">¿Deseas añadir otro grado o continuar con los profesores?</p>
                    <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => { setGradeContinuePrompt(false); setNewGradeSignal(s => s + 1); }}>+ Añadir otro grado</button>
                        <button className="submit-btn" onClick={() => { setGradeContinuePrompt(false); setPhase(4); }}>Continuar a Profesores →</button>
                    </div>
                </Modal>
            )}

            {/* Modal cambios sin guardar */}
            {pendingAction && (
                <Modal title={t('unsaved_title')} onClose={modalCancel}>
                    <p className="confirm-text">{t('unsaved_text')}</p>
                    <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={modalCancel}>{t('unsaved_cancel')}</button>
                        <button className="btn-danger" onClick={modalDiscard}>{t('unsaved_discard')}</button>
                        <button className="submit-btn" onClick={modalSave} disabled={saving}>
                            {saving ? '...' : t('unsaved_save')}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal: salir de un borrador con datos */}
            {draftExitPrompt && (
                <Modal title={t('draft_exit_title')} onClose={() => setDraftExitPrompt(false)}>
                    <p className="confirm-text">{t('draft_exit_text')}</p>
                    <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => setDraftExitPrompt(false)}>{t('unsaved_cancel')}</button>
                        <button className="btn-danger" onClick={draftDiscardAll}>{t('draft_discard_all')}</button>
                        <button className="submit-btn" onClick={draftSaveAsDraft}>{t('draft_save_as')}</button>
                    </div>
                </Modal>
            )}
        </>
    );
}

/* ---------- Fase 5: Preferencias ---------- */
function Phase5({ prefs, setPrefs, scheduleId, t }) {
    const [tab, setTab] = useState('general');
    return (
        <div className="settings-card" style={{ maxWidth: '860px', margin: '0 auto' }}>
            <div className="day-tabs" style={{ marginBottom: '18px' }}>
                <button className={tab === 'general' ? 'active' : ''} onClick={() => setTab('general')}>
                    {t('pref_tab_general') !== 'pref_tab_general' ? t('pref_tab_general') : 'General'}
                </button>
                <button className={tab === 'detailed' ? 'active' : ''} onClick={() => setTab('detailed')}>
                    {t('pref_tab_detailed') !== 'pref_tab_detailed' ? t('pref_tab_detailed') : 'Preferencias detalladas'}
                </button>
            </div>

            {tab === 'general'
                ? <Phase5General prefs={prefs} setPrefs={setPrefs} t={t} />
                : <Phase5Detailed scheduleId={scheduleId} t={t} />}
        </div>
    );
}

/* Pestaña General: solo 2 opciones */
function Phase5General({ prefs, setPrefs, t }) {
    const toggle = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));
    const options = [
        ['noRepeatSameDay', t('pref_no_repeat')],
        ['avoidNoBreak', t('pref_avoid_no_break')],
    ];
    return (
        <>
            <p className="wizard-hint">{t('phase5_hint')}</p>
            {options.map(([k, label]) => (
                <label className="pref-row" key={k}>
                    <input type="checkbox" checked={!!prefs[k]} onChange={() => toggle(k)} />
                    <span>{label}</span>
                </label>
            ))}
        </>
    );
}

/* Pestaña Preferencias detalladas: tabla con filtros */
function Phase5Detailed({ scheduleId, t }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    // Filtros
    const [fGrade, setFGrade] = useState('');
    const [fSubject, setFSubject] = useState('');
    const [fTeacher, setFTeacher] = useState('');

    const load = async () => {
        setLoading(true); setError('');
        try {
            const res = await getPrefDetails(scheduleId);
            setRows((res.data || []).map(r => ({
                grade_id: r.grade_id, grade_name: r.grade_name,
                subject_id: r.subject_id, subject_name: r.subject_name, color_id: r.color_id,
                weekly_hours: r.weekly_hours,
                teacher_id: r.teacher_id, teacher_name: r.teacher_name,
                grouping: r.grouping || 'NONE',
            })));
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar preferencias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const setGrouping = (idx, value) => {
        setRows(rs => rs.map((r, i) => i === idx ? { ...r, grouping: value } : r));
    };

    const handleSave = async () => {
        setSaving(true); setSavedMsg(''); setError('');
        try {
            await savePrefDetails(scheduleId, rows.map(r => ({
                grade_id: r.grade_id, subject_id: r.subject_id, grouping: r.grouping,
            })));
            setSavedMsg(t('prefs_saved') !== 'prefs_saved' ? t('prefs_saved') : 'Preferencias guardadas.');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    // Opciones únicas para los filtros
    const gradeOptions = [...new Map(rows.map(r => [r.grade_id, r.grade_name])).entries()];
    const subjectOptions = [...new Map(rows.map(r => [r.subject_id, r.subject_name])).entries()];
    const teacherOptions = [...new Map(rows.filter(r => r.teacher_id).map(r => [r.teacher_id, r.teacher_name])).entries()];

    const clearFilters = () => { setFGrade(''); setFSubject(''); setFTeacher(''); };

    const filtered = rows
        .map((r, i) => ({ ...r, _idx: i }))
        .filter(r =>
            (!fGrade || String(r.grade_id) === fGrade) &&
            (!fSubject || String(r.subject_id) === fSubject) &&
            (!fTeacher || String(r.teacher_id) === fTeacher)
        );

    return (
        <>
            {loading && <p className="loading-text">{t('loading')}</p>}
            {error && <p className="error-msg" style={{ display: 'block' }}>{error}</p>}

            {!loading && rows.length === 0 && (
                <p className="wizard-hint">{t('prefs_empty') !== 'prefs_empty' ? t('prefs_empty') : 'No hay materias en las mallas de los grados (Fase 3).'}</p>
            )}

            {!loading && rows.length > 0 && (
                <>
                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '14px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label>{t('filter_grade') !== 'filter_grade' ? t('filter_grade') : 'Grupo'}</label>
                            <select value={fGrade} onChange={(e) => setFGrade(e.target.value)}>
                                <option value="">{t('filter_all_grades') !== 'filter_all_grades' ? t('filter_all_grades') : 'Todos los grupos'}</option>
                                {gradeOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label>{t('filter_subject') !== 'filter_subject' ? t('filter_subject') : 'Asignatura'}</label>
                            <select value={fSubject} onChange={(e) => setFSubject(e.target.value)}>
                                <option value="">{t('filter_all_subjects') !== 'filter_all_subjects' ? t('filter_all_subjects') : 'Todas las asignaturas'}</option>
                                {subjectOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label>{t('filter_teacher') !== 'filter_teacher' ? t('filter_teacher') : 'Profesor'}</label>
                            <select value={fTeacher} onChange={(e) => setFTeacher(e.target.value)}>
                                <option value="">{t('filter_all_teachers') !== 'filter_all_teachers' ? t('filter_all_teachers') : 'Todos los profesores'}</option>
                                {teacherOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                            </select>
                        </div>
                        <button className="btn-secondary" onClick={clearFilters}>{t('filter_clear') !== 'filter_clear' ? t('filter_clear') : 'Limpiar filtros'}</button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('filter_grade') !== 'filter_grade' ? t('filter_grade') : 'Grupo'}</th>
                                    <th>{t('subj_name') !== 'subj_name' ? t('subj_name') : 'Asignatura'}</th>
                                    <th>{t('teacher_col') !== 'teacher_col' ? t('teacher_col') : 'Profesor'}</th>
                                    <th>{t('num_classes') !== 'num_classes' ? t('num_classes') : 'Núm. Clases'}</th>
                                    <th>{t('grouping_config') !== 'grouping_config' ? t('grouping_config') : 'Configuración'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => (
                                    <tr key={`${r.grade_id}-${r.subject_id}`} style={!r.teacher_id ? { opacity: 0.6 } : undefined}>
                                        <td><strong>{r.grade_name}</strong></td>
                                        <td>
                                            <span className="color-dot" style={{ backgroundColor: r.color_id }}></span>
                                            {r.subject_name}
                                        </td>
                                        <td>{r.teacher_name || <span className="opaque-text">{t('unassigned') !== 'unassigned' ? t('unassigned') : 'No asignado'}</span>}</td>
                                        <td>{r.weekly_hours}</td>
                                        <td>
                                            <select
                                                value={r.grouping}
                                                disabled={!r.teacher_id}
                                                onChange={(e) => setGrouping(r._idx, e.target.value)}
                                                style={{ width: '100%', maxWidth: '340px' }}
                                            >
                                                <option value="NONE">{t('group_none') !== 'group_none' ? t('group_none') : 'No especificado'}</option>
                                                <option value="GROUP2">{t('group_two') !== 'group_two' ? t('group_two') : 'Agrupar al menos 2 horas seguidas un día'}</option>
                                                <option value="MAX1">{t('group_max1') !== 'group_max1' ? t('group_max1') : 'No permitir más de 1 hora de esta clase al día'}</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '18px' }}>
                        {savedMsg && <span className="global-msg" style={{ color: 'var(--success)', marginRight: 'auto' }}>{savedMsg}</span>}
                        <button className="submit-btn" onClick={handleSave} disabled={saving}>
                            {saving ? '...' : (t('save_prefs') !== 'save_prefs' ? t('save_prefs') : 'Guardar preferencias')}
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

/* ---------- Fase 6: Resultado ---------- */
function Phase6({ scheduleId, dayMode, days, workDays, t }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rows, setRows] = useState(null);     // clases generadas
    const [stats, setStats] = useState(null);
    const [loaded, setLoaded] = useState(false); // ¿ya intentamos cargar uno existente?

    const DAY_ORDER = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
    const dayLabels = { lun: t('day_mon'), mar: t('day_tue'), mie: t('day_wed'), jue: t('day_thu'), vie: t('day_fri'), sab: t('day_sat'), dom: t('day_sun') };

    // Días activos y su número de franjas (desde la Fase 1)
    const activeDays = DAY_ORDER.filter(k => workDays?.[k]);
    const hoursOf = (dk) => dayMode === 'uniform' ? (Number(days?.all?.hoursPerDay) || 0) : (Number(days?.[dk]?.hoursPerDay) || 0);
    const maxHours = Math.max(0, ...activeDays.map(hoursOf));

    // Al entrar, intenta cargar un horario ya generado
    useEffect(() => {
        (async () => {
            try {
                const res = await getGeneratedSchedule(scheduleId);
                if (res.data && res.data.length > 0) setRows(res.data);
            } catch { /* ninguno aún */ }
            finally { setLoaded(true); }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGenerate = async () => {
        setLoading(true); setError('');
        try {
            const res = await generateSchedule(scheduleId);
            if (!res.ok) { setError(res.message); setRows(null); }
            else {
                setStats(res.stats);
                const got = await getGeneratedSchedule(scheduleId);
                setRows(got.data || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('gen_error'));
        } finally {
            setLoading(false);
        }
    };

    // Agrupar clases por grado
    const grades = rows ? [...new Map(rows.map(r => [r.grade_id, r.grade_name])).entries()] : [];
    const cellFor = (gradeId, dk, h) => rows.find(r => r.grade_id === gradeId && r.day_key === dk && r.hour_index === h);

    return (
        <div className="settings-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', padding: rows ? '10px 0 20px' : '30px 0' }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>{t('phase6_ready_title')}</h2>
                <p style={{ color: 'var(--text-soft)', maxWidth: '520px', margin: '0 auto 18px' }}>{t('gen_intro')}</p>
                <button className="submit-btn" onClick={handleGenerate} disabled={loading}>
                    {loading ? t('gen_working') : (rows ? t('gen_regenerate') : t('gen_generate'))}
                </button>
            </div>

            {error && (
                <div className="global-msg bad" style={{ marginTop: '10px' }}>
                    {error}
                </div>
            )}

            {stats && !error && (
                <p style={{ textAlign: 'center', color: 'var(--success)', fontSize: '0.9rem' }}>
                    {t('gen_success')} · {stats.units} {t('gen_classes_placed')}
                </p>
            )}

            {/* Cuadrículas por grado */}
            {rows && grades.map(([gradeId, gradeName]) => (
                <div key={gradeId} style={{ marginTop: '24px', overflowX: 'auto' }}>
                    <h3 style={{ color: 'var(--primary-dark)', marginBottom: '10px' }}>{gradeName}</h3>
                    <table className="gen-grid">
                        <thead>
                            <tr>
                                <th>{t('hour_word')}</th>
                                {activeDays.map(dk => <th key={dk}>{dayLabels[dk]}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: maxHours }).map((_, h) => (
                                <tr key={h}>
                                    <td className="gen-hour">{h + 1}</td>
                                    {activeDays.map(dk => {
                                        if (h >= hoursOf(dk)) return <td key={dk} className="gen-off"></td>;
                                        const c = cellFor(gradeId, dk, h);
                                        return (
                                            <td key={dk}>
                                                {c ? (
                                                    <div className="gen-cell" style={{ background: (c.color_id || '#eee') + '22', borderLeft: `3px solid ${c.color_id || '#999'}` }}>
                                                        <div className="gen-subj">{c.abbreviation || c.subject_name}</div>
                                                        <div className="gen-teacher">{c.teacher_name || t('unassigned')}</div>
                                                    </div>
                                                ) : <div className="gen-empty">—</div>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}

            {loaded && !rows && !error && !loading && (
                <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.85rem', marginTop: '10px' }}>{t('gen_none_yet')}</p>
            )}
        </div>
    );
}

export default CreateSchedule;