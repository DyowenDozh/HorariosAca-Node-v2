// Vistas del horario generado (Por grado / General / Por profesor) + exportación.
import { useState, useMemo } from 'react';
import { buildTables, exportPdfs, exportExcel } from '../utils/exportSchedule';

export default function ScheduleViews({ rows, activeDays, dayLabels, hoursOf }) {
    const [view, setView] = useState('grado');
    const [siglas, setSiglas] = useState(false);
    const [sinColor, setSinColor] = useState(false);
    const [ocultarProfesor, setOcultarProfesor] = useState(false);

    const meta = useMemo(() => {
        const days = activeDays.map(dk => ({ key: dk, label: dayLabels[dk] || dk, hours: hoursOf(dk) }));
        const gmap = new Map(); rows.forEach(r => { if (!gmap.has(r.grade_id)) gmap.set(r.grade_id, r.grade_name); });
        const tmap = new Map(); rows.forEach(r => { if (r.teacher_id && !tmap.has(r.teacher_id)) tmap.set(r.teacher_id, r.teacher_name); });
        return { days, grades: [...gmap].map(([id, name]) => ({ id, name })), teachers: [...tmap].map(([id, name]) => ({ id, name })) };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, activeDays, dayLabels]);

    const opts = { siglas, sinColor, ocultarProfesor };
    const tables = useMemo(() => buildTables(rows, meta, opts), [rows, meta, siglas, sinColor, ocultarProfesor]);
    const shown = view === 'grado' ? tables.grados : view === 'general' ? tables.general : tables.profesores;

    return (
        <div style={{ marginTop: '20px' }}>
            {/* Vistas + exportación */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div className="day-tabs">
                    <button className={view === 'grado' ? 'active' : ''} onClick={() => setView('grado')}>Por grado</button>
                    <button className={view === 'general' ? 'active' : ''} onClick={() => setView('general')}>General</button>
                    <button className={view === 'profesor' ? 'active' : ''} onClick={() => setView('profesor')}>Por profesor</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={() => exportPdfs(rows, meta, opts)}>📄 Descargar PDF (3 archivos)</button>
                    <button className="btn-secondary" onClick={() => exportExcel(rows, meta, opts)}>📊 Descargar Excel</button>
                </div>
            </div>

            {/* Opciones */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '14px', fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={siglas} onChange={e => setSiglas(e.target.checked)} /> Usar siglas</label>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={sinColor} onChange={e => setSinColor(e.target.checked)} /> Sin color</label>
                {view === 'grado' && (
                    <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={ocultarProfesor} onChange={e => setOcultarProfesor(e.target.checked)} /> Ocultar profesores (vista estudiante)</label>
                )}
            </div>

            {/* Tablas de la vista seleccionada */}
            {shown.map((tb, i) => (
                <div key={i} style={{ marginTop: '18px', overflowX: 'auto' }}>
                    <h3 style={{ color: 'var(--primary-dark)', marginBottom: '10px' }}>{tb.title}</h3>
                    <table className="gen-grid">
                        <thead>
                            <tr>{tb.head.map((h, j) => <th key={j}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {tb.body.map((r, ri) => (
                                <tr key={ri}>
                                    {r.map((c, ci) => (
                                        <td key={ci} className={c.hour ? 'gen-hour' : (c.off ? 'gen-off' : '')} style={c.bg ? { background: c.bg } : undefined}>
                                            {c.text ? c.text.split('\n').map((ln, li) => <div key={li}>{ln}</div>) : ''}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}