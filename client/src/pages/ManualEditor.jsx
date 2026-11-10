// Editor manual del horario.
// - Entra directo con el horario que exista; "Limpiar horario" lo deja vacío (desde cero).
// - Modo de edición conmutable en caliente: por grados / por profesores (conserva el horario).
// - Paleta de materias con contador "colocadas/total"; lápiz para poner, borrador para quitar.
// - Coloreo al tener una ficha en la mano: blanco = libre, rojo = al poner se quita algo.
// - Al soltar en rojo, se avisa qué se quitará (casilla del grado y/o clase del mismo
//   profesor en otro grado); lo quitado vuelve a pendientes.
// - Guardar explícito; avisa si hay cambios sin guardar al cambiar de entidad o salir.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getEditorContext, saveManualSchedule } from '../services/api';
import Modal from '../components/Modal';

const DAY_LABELS = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' };
const K = (a, b, c) => `${a}|${b}|${c}`;

// Aclara un color hex mezclándolo con blanco (para fondos suaves).
function tint(hex, f = 0.80) {
    if (!hex || String(hex).length !== 7) return '#f3f3fa';
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const mix = (c) => Math.round(c + (255 - c) * f);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export default function ManualEditor({ scheduleId, onClose }) {
    const [ctx, setCtx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [view, setView] = useState('grade');     // 'grade' | 'teacher'

    // Estado de edición
    const [grid, setGrid] = useState([]);           // [{grade_id, subject_id, teacher_id, day_key, hour_index}]
    const [selected, setSelected] = useState(null); // grade_id o teacher_id seleccionado
    const [tool, setTool] = useState('pencil');     // 'pencil' | 'eraser'
    const [held, setHeld] = useState(null);         // ficha en la mano {grade_id, subject_id, teacher_id}
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    const [confirm, setConfirm] = useState(null);   // {removals:[...], apply:fn}
    const [pending, setPending] = useState(null);   // acción pendiente tras aviso de cambios sin guardar
    const [confirmClear, setConfirmClear] = useState(false); // confirmación de limpiar horario

    // Entra directo al modo edición: carga el horario que exista (o vacío).
    useEffect(() => {
        (async () => {
            try {
                const res = await getEditorContext(scheduleId);
                setCtx(res.data);
                setGrid((res.data.placements || []).map(p => ({
                    grade_id: p.grade_id, subject_id: p.subject_id, teacher_id: p.teacher_id, day_key: p.day_key, hour_index: p.hour_index,
                })));
                setSelected(res.data.grades[0]?.grade_id ?? null);
            } catch {
                setError('No se pudo cargar la información del horario.');
            } finally { setLoading(false); }
        })();
    }, [scheduleId]);

    // ---- Diccionarios ----
    const subjById = useMemo(() => { const m = {}; (ctx?.subjects || []).forEach(s => m[s.subject_id] = s); return m; }, [ctx]);
    const teacherById = useMemo(() => { const m = {}; (ctx?.teachers || []).forEach(t => m[t.teacher_id] = t); return m; }, [ctx]);
    const gradeById = useMemo(() => { const m = {}; (ctx?.grades || []).forEach(g => m[g.grade_id] = g); return m; }, [ctx]);
    const days = ctx?.days || [];
    const maxHours = useMemo(() => Math.max(0, ...days.map(d => d.hours)), [days]);

    // Demanda por grado-materia: horas y profesor asignado
    const demandMap = useMemo(() => {
        const m = {}; (ctx?.demands || []).forEach(d => m[`${d.grade_id}|${d.subject_id}`] = d); return m;
    }, [ctx]);

    // ---- Ocupación (derivada de grid) ----
    const gradeSlot = useMemo(() => { const m = new Map(); grid.forEach(p => m.set(K(p.grade_id, p.day_key, p.hour_index), p)); return m; }, [grid]);
    const teacherSlot = useMemo(() => { const m = new Map(); grid.forEach(p => { if (p.teacher_id != null) m.set(K(p.teacher_id, p.day_key, p.hour_index), p); }); return m; }, [grid]);
    const placedCount = useMemo(() => { const m = {}; grid.forEach(p => { const k = `${p.grade_id}|${p.subject_id}`; m[k] = (m[k] || 0) + 1; }); return m; }, [grid]);

    // ---- Limpiar todo el horario (desde cero) ----
    const clearAll = () => { setGrid([]); setHeld(null); setDirty(true); setConfirmClear(false); };

    // ---- Guardar ----
    const doSave = useCallback(async () => {
        setSaving(true); setError('');
        try {
            await saveManualSchedule(scheduleId, grid);
            setDirty(false); setSavedMsg('Cambios guardados.');
            setTimeout(() => setSavedMsg(''), 2500);
            return true;
        } catch {
            setError('No se pudo guardar.'); return false;
        } finally { setSaving(false); }
    }, [scheduleId, grid]);

    // Ejecuta una acción, avisando antes si hay cambios sin guardar
    const guard = (action) => { if (dirty) setPending(() => action); else action(); };

    // ---- Paleta ----
    // Lista de fichas (clases) de la entidad seleccionada, con pendientes.
    const palette = useMemo(() => {
        if (selected == null) return [];
        const items = (ctx?.demands || []).filter(d => view === 'grade' ? d.grade_id === selected : d.teacher_id === selected);
        return items.map(d => {
            const placed = placedCount[`${d.grade_id}|${d.subject_id}`] || 0;
            return { grade_id: d.grade_id, subject_id: d.subject_id, teacher_id: d.teacher_id, total: d.weekly_hours, placed, pending: d.weekly_hours - placed };
        });
    }, [ctx, view, selected, placedCount]);

    // En vista profesor agrupo por materia; en vista grado dejo lista simple.
    const paletteGroups = useMemo(() => {
        if (view === 'grade') return [{ key: 'all', label: null, items: palette }];
        const by = new Map();
        palette.forEach(it => { const s = subjById[it.subject_id]; const name = s?.subject_name || '—'; if (!by.has(name)) by.set(name, []); by.get(name).push(it); });
        return [...by.entries()].map(([label, items]) => ({ key: label, label, items }));
    }, [palette, view, subjById]);

    // ---- Qué se quita al poner `held` en (day,hour) ----
    const removalsFor = useCallback((day, hour) => {
        if (!held) return [];
        const rem = [];
        const gOcc = gradeSlot.get(K(held.grade_id, day, hour));
        if (gOcc) rem.push(gOcc);
        if (held.teacher_id != null) {
            const tOcc = teacherSlot.get(K(held.teacher_id, day, hour));
            if (tOcc && tOcc !== gOcc) rem.push(tOcc);
        }
        return rem;
    }, [held, gradeSlot, teacherSlot]);

    const placeHeld = (day, hour, removals) => {
        setGrid(prev => {
            let next = prev;
            if (removals.length) next = next.filter(p => !removals.includes(p));
            next = [...next, { grade_id: held.grade_id, subject_id: held.subject_id, teacher_id: held.teacher_id, day_key: day, hour_index: hour }];
            return next;
        });
        setDirty(true);
        // Si ya no quedan pendientes de esta ficha, la soltamos
        const placedAfter = (placedCount[`${held.grade_id}|${held.subject_id}`] || 0) + 1 - (removals.filter(r => r.grade_id === held.grade_id && r.subject_id === held.subject_id).length);
        const total = demandMap[`${held.grade_id}|${held.subject_id}`]?.weekly_hours || 0;
        if (placedAfter >= total) setHeld(null);
    };

    // ---- Clic en una casilla de la grilla ----
    const onCell = (day, hour, occupant) => {
        if (tool === 'eraser') {
            if (occupant) { setGrid(prev => prev.filter(p => p !== occupant)); setDirty(true); }
            return;
        }
        // lápiz
        if (!held) {
            // Si la casilla tiene algo, "tomar" esa clase para reubicarla
            if (occupant) { setHeld({ grade_id: occupant.grade_id, subject_id: occupant.subject_id, teacher_id: occupant.teacher_id }); setGrid(prev => prev.filter(p => p !== occupant)); setDirty(true); }
            return;
        }
        // Red de seguridad: no colocar de más si la ficha ya está completa.
        const placedNow = grid.filter(p => p.grade_id === held.grade_id && p.subject_id === held.subject_id).length;
        const totalNow = demandMap[`${held.grade_id}|${held.subject_id}`]?.weekly_hours || 0;
        if (placedNow >= totalNow) { setHeld(null); return; }
        const removals = removalsFor(day, hour);
        if (removals.length === 0) { placeHeld(day, hour, []); return; }
        // Hay que quitar algo → avisar
        setConfirm({ day, hour, removals, apply: () => { placeHeld(day, hour, removals); setConfirm(null); } });
    };

    if (loading) return <div className="settings-card" style={{ textAlign: 'center' }}><p className="loading-text">Cargando…</p></div>;
    if (error && !ctx) return <div className="settings-card"><div className="global-msg bad">{error}</div></div>;

    // ============================ EDICIÓN ============================
    const entities = view === 'grade' ? ctx.grades.map(g => ({ id: g.grade_id, name: g.grade_name })) : ctx.teachers.map(t => ({ id: t.teacher_id, name: t.teacher_name }));
    const selName = (view === 'grade' ? gradeById[selected]?.grade_name : teacherById[selected]?.teacher_name) || '';

    // Celda: contenido y color
    const cellInfo = (day, hour) => {
        const occ = view === 'grade' ? gradeSlot.get(K(selected, day, hour)) : teacherSlot.get(K(selected, day, hour));
        return occ;
    };

    return (
        <div className="settings-card" style={{ margin: '0 auto' }}>
            {/* Barra superior */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={() => guard(onClose)} style={{ alignSelf: 'center', padding: '7px 14px', fontSize: '0.88rem', width: 'auto', flex: '0 0 auto' }}>← Volver</button>

                    {/* Recuadro: Modo de edición (cambiar de vista conserva el horario) */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginBottom: '5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Modo de edición</div>
                        <div className="day-tabs">
                            <button className={view === 'grade' ? 'active' : ''} onClick={() => { if (view !== 'grade') { setView('grade'); setSelected(ctx.grades[0]?.grade_id ?? null); setHeld(null); } }}>Por grados</button>
                            <button className={view === 'teacher' ? 'active' : ''} onClick={() => { if (view !== 'teacher') { setView('teacher'); setSelected(ctx.teachers[0]?.teacher_id ?? null); setHeld(null); } }}>Por profesores</button>
                        </div>
                    </div>

                    {/* Recuadro: Herramientas (con ayuda) */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginBottom: '5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            Herramientas
                            <span title={'Lápiz: toma una materia de la lista (o una clase del horario) y colócala en una casilla con un clic.\nBorrador: clic sobre una clase para quitarla; vuelve a la lista de pendientes.'}
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '15px', height: '15px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.68rem', fontWeight: 700, cursor: 'help' }}>?</span>
                        </div>
                        <div className="day-tabs">
                            <button className={tool === 'pencil' ? 'active' : ''} title="Coloca materias en las casillas" onClick={() => { setTool('pencil'); }}>✏️ Lápiz</button>
                            <button className={tool === 'eraser' ? 'active' : ''} title="Quita la clase de una casilla" onClick={() => { setTool('eraser'); setHeld(null); }}>🧽 Borrador</button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {savedMsg && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{savedMsg}</span>}
                    {dirty && <span style={{ color: '#b26a00', fontSize: '0.8rem' }}>● sin guardar</span>}
                    <button className="btn-secondary" onClick={() => setConfirmClear(true)} disabled={grid.length === 0} style={{ padding: '7px 14px', fontSize: '0.88rem', width: 'auto', flex: '0 0 auto' }}>🗑️ Limpiar horario</button>
                    <button className="submit-btn" onClick={doSave} disabled={saving || !dirty} style={{ padding: '7px 14px', fontSize: '0.88rem', width: 'auto', flex: '0 0 auto' }}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
                </div>
            </div>

            {error && <div className="global-msg bad" style={{ marginBottom: '10px' }}>{error}</div>}

            {/* Selector de entidad */}
            <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginRight: '8px' }}>{view === 'grade' ? 'Grado:' : 'Profesor:'}</label>
                <select value={selected ?? ''} onChange={e => { setSelected(Number(e.target.value)); setHeld(null); }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    {entities.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Paleta */}
                <div style={{ flex: '0 0 230px', minWidth: '210px' }}>
                    <h4 style={{ margin: '0 0 8px', color: 'var(--primary)' }}>Materias {view === 'grade' ? 'del grado' : 'del profesor'}</h4>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-soft)', margin: '0 0 10px' }}>
                        {tool === 'eraser' ? 'Borrador activo: clic en una clase para quitarla.' : (held ? 'Clic en una casilla blanca para ponerla.' : 'Clic en una materia para tomarla.')}
                    </p>
                    {paletteGroups.map(grp => (
                        <div key={grp.key} style={{ marginBottom: grp.label ? '10px' : 0 }}>
                            {grp.label && <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-soft)', margin: '4px 0' }}>{grp.label}</div>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {grp.items.map(it => {
                                    const s = subjById[it.subject_id];
                                    const isHeld = held && held.grade_id === it.grade_id && held.subject_id === it.subject_id;
                                    const done = it.pending <= 0;
                                    const label = view === 'grade' ? (s?.subject_name || '—') : (gradeById[it.grade_id]?.grade_name || '—');
                                    const sub = view === 'grade' ? (teacherById[it.teacher_id]?.teacher_name || 'Sin profesor') : (s?.subject_name || '');
                                    return (
                                        <button key={`${it.grade_id}-${it.subject_id}`} onClick={() => { if (tool !== 'eraser' && !done) setHeld(isHeld ? null : { grade_id: it.grade_id, subject_id: it.subject_id, teacher_id: it.teacher_id }); }}
                                            disabled={tool === 'eraser' || done}
                                            style={{
                                                textAlign: 'left', padding: '7px 9px', borderRadius: '8px', cursor: (tool === 'eraser' || done) ? 'default' : 'pointer',
                                                border: isHeld ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: done ? '#f3f7f3' : (isHeld ? 'var(--primary-light)' : tint(s?.color_id)),
                                                opacity: done ? 0.7 : 1,
                                            }}>
                                            <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{label}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{sub}</span><span>{done ? '✓' : `${it.placed}/${it.total}`}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grilla */}
                <div style={{ flex: '1 1 420px', overflowX: 'auto' }}>
                    <h4 style={{ margin: '0 0 8px', color: 'var(--primary-dark)' }}>{selName}</h4>
                    <table className="gen-grid">
                        <thead><tr><th>Hora</th>{days.map(d => <th key={d.day_key}>{DAY_LABELS[d.day_key] || d.day_key}</th>)}</tr></thead>
                        <tbody>
                            {Array.from({ length: maxHours }, (_, h) => (
                                <tr key={h}>
                                    <td className="gen-hour">{h + 1}</td>
                                    {days.map(d => {
                                        if (h >= d.hours) return <td key={d.day_key} className="gen-off" />;
                                        const occ = cellInfo(d.day_key, h);
                                        let bg, cursor = 'default', title = '';
                                        if (held && tool === 'pencil') {
                                            const rem = removalsFor(d.day_key, h);
                                            bg = rem.length ? '#fde2e2' : '#e6f7ea';
                                            cursor = 'pointer';
                                            title = rem.length ? 'Ocupado: al poner se quita lo que hay' : 'Libre';
                                        } else if (occ) {
                                            bg = tint(subjById[occ.subject_id]?.color_id);
                                            cursor = tool === 'eraser' ? 'pointer' : 'pointer';
                                        }
                                        const primary = occ ? (view === 'grade' ? (subjById[occ.subject_id]?.subject_name || '—') : (gradeById[occ.grade_id]?.grade_name || '—')) : '';
                                        const secondary = occ ? (view === 'grade' ? (teacherById[occ.teacher_id]?.teacher_name || '') : (subjById[occ.subject_id]?.subject_name || '')) : '';
                                        return (
                                            <td key={d.day_key} onClick={() => onCell(d.day_key, h, occ)} title={title}
                                                style={{ background: bg, cursor }}>
                                                {occ && <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{primary}</div>}
                                                {occ && secondary && <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>{secondary}</div>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Aviso: se va a quitar algo */}
            {confirm && (
                <Modal title="La hora ya está ocupada" onClose={() => setConfirm(null)}>
                    <p style={{ marginBottom: '8px' }}>Para poner esta clase hay que quitar:</p>
                    <ul style={{ margin: '0 0 10px', paddingLeft: '18px' }}>
                        {confirm.removals.map((r, i) => (
                            <li key={i} style={{ fontSize: '0.88rem' }}>
                                {gradeById[r.grade_id]?.grade_name} — {subjById[r.subject_id]?.subject_name} ({teacherById[r.teacher_id]?.teacher_name || 'sin profesor'})
                            </li>
                        ))}
                    </ul>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>Lo que se quite volverá a la lista de pendientes para recolocarlo.</p>
                    <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => setConfirm(null)}>Cancelar</button>
                        <button className="submit-btn" onClick={confirm.apply}>Quitar y poner</button>
                    </div>
                </Modal>
            )}

            {/* Aviso: cambios sin guardar */}
            {pending && (
                <Modal title="Cambios sin guardar" onClose={() => setPending(null)}>
                    <p>Tienes cambios sin guardar. ¿Qué quieres hacer?</p>
                    <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => { const a = pending; setPending(null); a(); }}>Descartar y continuar</button>
                        <button className="submit-btn" onClick={async () => { const a = pending; const ok = await doSave(); if (ok) { setPending(null); a(); } }} disabled={saving}>{saving ? 'Guardando…' : 'Guardar y continuar'}</button>
                    </div>
                </Modal>
            )}

            {/* Confirmación: limpiar todo el horario */}
            {confirmClear && (
                <Modal title="Limpiar horario" onClose={() => setConfirmClear(false)}>
                    <p>Esto quitará <strong>todas</strong> las clases del horario y lo dejará vacío para armarlo desde cero.</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>No se borra definitivamente hasta que le des "Guardar cambios".</p>
                    <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => setConfirmClear(false)}>Cancelar</button>
                        <button className="btn-danger" onClick={clearAll}>Limpiar todo</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}