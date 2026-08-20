// Phase1DayConfig.jsx - Fase 1: configuración del día con diales, descansos
// múltiples arrastrables y aviso de 0 horas.
import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import Modal from '../components/Modal';
import Dial, { pad2 } from '../components/Dial';

const DAY_KEYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

// Estructura por defecto de un día
const defaultDay = () => ({
    hoursPerDay: 1,
    classH: 1,           // duración clase: horas
    classM: 0,           // duración clase: minutos
    startH: 6,           // hora inicio (1-12)
    startM: 0,           // minuto inicio
    startAP: 'AM',       // AM / PM
    breaks: [            // lista de descansos: cada uno va después de la hora N
        { id: 1, afterHour: 1, minutes: 30 },
    ],
});

// Convierte hora 12h + AM/PM a minutos desde medianoche
function start24Minutes(day) {
    let h = day.startH % 12;
    if (day.startAP === 'PM') h += 12;
    return h * 60 + day.startM;
}

function fmt(totalMin) {
    const h = Math.floor((totalMin % (24 * 60)) / 60);
    const m = totalMin % 60;
    return `${pad2(h)}:${pad2(m)}`;
}

// Construye las franjas del día (clases + descansos intercalados)
function buildSlots(day) {
    const slots = [];
    const classLen = Number(day.classH) * 60 + Number(day.classM);
    let cursor = start24Minutes(day);
    for (let i = 1; i <= day.hoursPerDay; i++) {
        const end = cursor + classLen;
        slots.push({ type: 'class', label: i, start: cursor, end });
        cursor = end;
        // Insertar los descansos que van después de esta hora
        day.breaks.filter(b => Number(b.afterHour) === i && i < day.hoursPerDay)
            .forEach(b => {
                const bEnd = cursor + Number(b.minutes);
                slots.push({ type: 'break', id: b.id, minutes: b.minutes, start: cursor, end: bEnd });
                cursor = bEnd;
            });
    }
    return slots;
}

function Phase1DayConfig({ mode, setMode, days, setDays, workDays, setWorkDays, toggleWorkDay }) {
    const { t } = useLanguage();
    const [activeDay, setActiveDay] = useState('lun');
    const [copyConfirm, setCopyConfirm] = useState(false);
    const [zeroWarn, setZeroWarn] = useState(null); // día pendiente de confirmar quitar
    // Editor de descanso: { mode:'add'|'edit', id, minutes }
    const [breakEditor, setBreakEditor] = useState(null);
    // Modal al cambiar de "uniforme" a "por día": ¿usar estructura creada o empezar de cero?
    const [perdayPrompt, setPerdayPrompt] = useState(false);

    const activeWorkDays = DAY_KEYS.filter(k => workDays[k]);
    const editingKey = mode === 'uniform' ? 'all' : activeDay;
    const day = days[editingKey] || days.all;

    const setDayField = (field, value) => {
        setDays(prev => ({ ...prev, [editingKey]: { ...prev[editingKey], [field]: value } }));
    };

    // Cambio de horas por día: si baja a 0 en modo por-día, avisa
    const setHoursPerDay = (v) => {
        if (v === 0 && mode === 'perday') {
            setZeroWarn(editingKey);
            return; // no aplica aún; espera confirmación
        }
        const minV = mode === 'uniform' ? 1 : 0;
        setDayField('hoursPerDay', Math.max(minV, v));
    };

    const confirmRemoveDay = () => {
        const k = zeroWarn;
        setWorkDays(w => ({ ...w, [k]: false }));
        setDays(prev => ({ ...prev, [k]: { ...prev[k], hoursPerDay: 1 } })); // reset a 1 para la próxima
        setZeroWarn(null);
        // mover la pestaña activa a otro día laboral
        const rest = DAY_KEYS.filter(d => d !== k && workDays[d]);
        if (rest.length) setActiveDay(rest[0]);
    };

    const copyToAll = () => {
        const source = days[editingKey];
        const copy = {};
        activeWorkDays.forEach(k => { copy[k] = { ...source, breaks: source.breaks.map(b => ({ ...b })) }; });
        setDays(prev => ({ ...prev, ...copy }));
        setCopyConfirm(false);
    };

    // ¿La configuración uniforme fue modificada respecto a la de por defecto?
    const uniformIsCustom = () => {
        return JSON.stringify(days.all) !== JSON.stringify(defaultDay());
    };

    // Al pulsar "Configurar cada día"
    const switchToPerday = () => {
        if (mode === 'perday') return;
        if (uniformIsCustom()) {
            setPerdayPrompt(true); // preguntar si usar la estructura creada o empezar de cero
        } else {
            setMode('perday'); // sin cambios: cambia directo
        }
    };

    // Opción del modal: usar la estructura uniforme en todos los días laborales
    const perdayUseExisting = () => {
        const source = days.all;
        const copy = {};
        activeWorkDays.forEach(k => { copy[k] = { ...source, breaks: source.breaks.map(b => ({ ...b })) }; });
        setDays(prev => ({ ...prev, ...copy }));
        setMode('perday');
        setPerdayPrompt(false);
    };

    // Opción del modal: cada día empieza de cero
    const perdayStartFresh = () => {
        const copy = {};
        activeWorkDays.forEach(k => { copy[k] = defaultDay(); });
        setDays(prev => ({ ...prev, ...copy }));
        setMode('perday');
        setPerdayPrompt(false);
    };

    const slots = useMemo(() => buildSlots(day), [day]);

    // --- Descansos ---
    // Abrir el editor para agregar (elige duración primero)
    const openAddBreak = () => setBreakEditor({ mode: 'add', minutes: 30 });
    // Abrir el editor para modificar la duración de un descanso existente
    const openEditBreak = (b) => setBreakEditor({ mode: 'edit', id: b.id, minutes: b.minutes });

    // Confirmar el editor (crear o actualizar)
    const confirmBreakEditor = () => {
        const mins = Math.max(1, Math.min(60, breakEditor.minutes));
        if (breakEditor.mode === 'add') {
            const nextId = Math.max(0, ...day.breaks.map(b => b.id)) + 1;
            setDayField('breaks', [...day.breaks, { id: nextId, afterHour: 1, minutes: mins }]);
        } else {
            setDayField('breaks', day.breaks.map(b => b.id === breakEditor.id ? { ...b, minutes: mins } : b));
        }
        setBreakEditor(null);
    };

    const removeBreak = (id) => {
        setDayField('breaks', day.breaks.filter(b => b.id !== id));
    };
    const moveBreak = (id, afterHour) => {
        setDayField('breaks', day.breaks.map(b => b.id === id ? { ...b, afterHour } : b));
    };

    // --- Drag & drop dinámico ---
    const [dragId, setDragId] = useState(null);
    const [dropAfter, setDropAfter] = useState(null); // hora tras la cual caería

    const days7 = [
        ['lun', t('day_mon')], ['mar', t('day_tue')], ['mie', t('day_wed')],
        ['jue', t('day_thu')], ['vie', t('day_fri')], ['sab', t('day_sat')], ['dom', t('day_sun')],
    ];

    const handleDragOver = (e, hourLabel) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const overHalf = (e.clientY - rect.top) > rect.height / 2;
        // Si pasa la mitad de la fila, cae después de esta hora; si no, después de la anterior
        setDropAfter(overHalf ? hourLabel : hourLabel - 1);
    };

    const handleDrop = () => {
        if (dragId != null && dropAfter != null && dropAfter >= 1 && dropAfter < day.hoursPerDay) {
            moveBreak(dragId, dropAfter);
        }
        setDragId(null);
        setDropAfter(null);
    };

    return (
        <div className="settings-card" style={{ maxWidth: '660px', margin: '0 auto' }}>
            {/* Días laborales */}
            <label className="p1-label">{t('phase1_workdays')}</label>
            <div className="day-chips" style={{ marginBottom: '22px' }}>
                {days7.map(([k, label]) => (
                    <button type="button" key={k}
                        className={`day-chip ${workDays[k] ? 'on' : ''}`}
                        onClick={() => toggleWorkDay(k)}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Modo */}
            <div className="mode-switch">
                <button className={mode === 'uniform' ? 'active' : ''} onClick={() => setMode('uniform')}>
                    {t('mode_uniform')}
                </button>
                <button className={mode === 'perday' ? 'active' : ''} onClick={switchToPerday}>
                    {t('mode_perday')}
                </button>
            </div>

            {/* Pestañas por día */}
            {mode === 'perday' && (
                <div className="day-tabs">
                    {activeWorkDays.map(k => (
                        <button key={k} className={activeDay === k ? 'active' : ''} onClick={() => setActiveDay(k)}>
                            {days7.find(d => d[0] === k)?.[1] || k}
                        </button>
                    ))}
                </div>
            )}

            {/* Diales */}
            <div className="dials-row">
                <div className="dial-block">
                    <div className="dial-title">{t('phase1_hours_per_day')}</div>
                    <Dial value={day.hoursPerDay} min={0} max={24} onChange={setHoursPerDay} width="96px" />
                </div>

                <div className="dial-block">
                    <div className="dial-title">{t('phase1_class_dur')}</div>
                    <div className="dial-pair">
                        <Dial value={day.classH} min={0} max={24} onChange={(v) => setDayField('classH', v)} label={t('hours_word')} width="66px" />
                        <span className="dial-colon">:</span>
                        <Dial value={day.classM} min={0} max={59} wrap onChange={(v) => setDayField('classM', v)} label="min" width="66px" />
                    </div>
                </div>

                <div className="dial-block">
                    <div className="dial-title">{t('phase1_start')}</div>
                    <div className="dial-pair">
                        <Dial value={day.startH} min={1} max={12} wrap onChange={(v) => setDayField('startH', v)} label={t('hour_word')} width="60px" />
                        <span className="dial-colon">:</span>
                        <Dial value={day.startM} min={0} max={59} wrap onChange={(v) => setDayField('startM', v)} label="min" width="60px" />
                        <div className="ampm">
                            <button className={day.startAP === 'AM' ? 'on' : ''} onClick={() => setDayField('startAP', 'AM')}>AM</button>
                            <button className={day.startAP === 'PM' ? 'on' : ''} onClick={() => setDayField('startAP', 'PM')}>PM</button>
                        </div>
                    </div>
                </div>
            </div>

            {mode === 'perday' && (
                <button className="link-btn" style={{ marginBottom: '18px' }} onClick={() => setCopyConfirm(true)}>
                    {t('copy_to_all')}
                </button>
            )}

            {/* Estructura del día */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label className="p1-label" style={{ margin: 0 }}>{t('phase1_day_structure')}</label>
                    <button className="add-break-btn" onClick={openAddBreak}>+ {t('add_break')}</button>
                </div>

                {day.hoursPerDay === 0 ? (
                    <p className="wizard-hint">{t('no_hours_msg')}</p>
                ) : (
                    <div className="day-structure" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                        {slots.map((slot, idx) => {
                            if (slot.type === 'break') {
                                return (
                                    <div key={`b-${slot.id}`}
                                        className={`slot-break ${dragId === slot.id ? 'is-dragging' : ''}`}
                                        draggable
                                        onDragStart={() => setDragId(slot.id)}
                                        onDragEnd={() => { setDragId(null); setDropAfter(null); }}>
                                        <span className="grip">⠿</span>
                                        <span>{t('break_word')} · {slot.minutes} min</span>
                                        <span className="slot-time">{fmt(slot.start)} – {fmt(slot.end)}</span>
                                        <button className="break-edit" onClick={() => openEditBreak(slot)} title={t('edit')}>✏️</button>
                                        <button className="break-x" onClick={() => removeBreak(slot.id)} title={t('remove')}>×</button>
                                    </div>
                                );
                            }
                            return (
                                <div key={`c-${idx}`}>
                                    {/* fantasma antes de esta hora */}
                                    {dragId != null && dropAfter === slot.label - 1 && (
                                        <div className="slot-break ghost"><span className="grip">⠿</span><span>{t('break_word')}</span></div>
                                    )}
                                    <div className="slot-class"
                                        onDragOver={(e) => handleDragOver(e, slot.label)}>
                                        <span className="slot-time">{fmt(slot.start)} – {fmt(slot.end)}</span>
                                        <span className="slot-label">{t('hour_word')} {slot.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <p className="wizard-hint" style={{ marginTop: '10px', fontSize: '0.82rem' }}>{t('drag_break_hint')}</p>
            </div>

            {/* Modal: cambiar a configurar cada día */}
            {perdayPrompt && (
                <Modal title={t('mode_perday')} onClose={() => setPerdayPrompt(false)}>
                    <p className="confirm-text">{t('perday_prompt_text')}</p>
                    <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => setPerdayPrompt(false)}>{t('btn_cancel')}</button>
                        <button className="btn-secondary" onClick={perdayStartFresh}>{t('perday_fresh')}</button>
                        <button className="submit-btn" onClick={perdayUseExisting}>{t('perday_use_existing')}</button>
                    </div>
                </Modal>
            )}

            {/* Modal copiar a todos */}
            {copyConfirm && (
                <Modal title={t('copy_to_all')} onClose={() => setCopyConfirm(false)}>
                    <p className="confirm-text">{t('copy_confirm_text')}</p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setCopyConfirm(false)}>{t('btn_cancel')}</button>
                        <button className="submit-btn" onClick={copyToAll}>{t('copy_confirm_yes')}</button>
                    </div>
                </Modal>
            )}

            {/* Modal editor de descanso (agregar / editar duración) */}
            {breakEditor && (
                <Modal
                    title={breakEditor.mode === 'add' ? t('add_break') : t('edit_break')}
                    onClose={() => setBreakEditor(null)}
                >
                    <p className="confirm-text">{t('break_duration_label')}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <div className="dial-block">
                            <div className="dial-title">{t('break_word')}</div>
                            <div className="dial-pair">
                                <Dial
                                    value={breakEditor.minutes}
                                    min={1}
                                    max={60}
                                    onChange={(v) => setBreakEditor(be => ({ ...be, minutes: v }))}
                                    label="min"
                                    width="80px"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setBreakEditor(null)}>{t('btn_cancel')}</button>
                        <button className="submit-btn" onClick={confirmBreakEditor}>
                            {breakEditor.mode === 'add' ? t('wizard_next') : t('settings_save')}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal aviso 0 horas */}
            {zeroWarn && (
                <Modal title={t('zero_title')} onClose={() => setZeroWarn(null)}>
                    <p className="confirm-text">
                        {t('zero_text')} <strong>{days7.find(d => d[0] === zeroWarn)?.[1]}</strong>.
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setZeroWarn(null)}>{t('zero_keep')}</button>
                        <button className="btn-danger" onClick={confirmRemoveDay}>{t('zero_remove')}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export { Phase1DayConfig, defaultDay };
export default Phase1DayConfig;