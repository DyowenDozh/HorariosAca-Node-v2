// Vistas del horario generado (Por grado / General / Por profesor) + exportación.
import { useState, useMemo } from 'react';
import { buildTables, exportPdfs, exportExcel } from '../utils/exportSchedule';
import { useLanguage } from '../i18n/LanguageContext';

export default function ScheduleViews({ rows, activeDays, dayLabels, hoursOf }) {
    const { t } = useLanguage();
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

    // Etiquetas localizadas para los archivos exportados (PDF/Excel).
    const labels = {
        hour: t('exp_hour'), grade: t('exp_grade'), general: t('exp_general_title'), teacher: t('exp_teacher'),
        sheetGrades: t('exp_sheet_grades'), sheetTeachers: t('exp_sheet_teachers'), sheetGeneral: t('exp_sheet_general'), fileName: t('exp_file_name'),
        pdfGrades: t('exp_pdf_grades'), pdfGeneral: t('exp_pdf_general'), pdfTeachers: t('exp_pdf_teachers'),
    };
    const opts = { siglas, sinColor, ocultarProfesor, labels };
    const tables = useMemo(() => buildTables(rows, meta, opts), [rows, meta, siglas, sinColor, ocultarProfesor]);
    const shown = view === 'grado' ? tables.grados : view === 'general' ? tables.general : tables.profesores;

    return (
        <div style={{ marginTop: '20px' }}>
            {/* Vistas + exportación */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div className="day-tabs">
                    <button className={view === 'grado' ? 'active' : ''} onClick={() => setView('grado')}>{t('view_by_grade')}</button>
                    <button className={view === 'general' ? 'active' : ''} onClick={() => setView('general')}>{t('view_general')}</button>
                    <button className={view === 'profesor' ? 'active' : ''} onClick={() => setView('profesor')}>{t('view_by_teacher')}</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={() => exportPdfs(rows, meta, opts)}>📄 {t('export_pdf_btn')}</button>
                    <button className="btn-secondary" onClick={() => exportExcel(rows, meta, opts)}>📊 {t('export_excel_btn')}</button>
                </div>
            </div>

            {/* Opciones */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '14px', fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={siglas} onChange={e => setSiglas(e.target.checked)} /> {t('opt_use_abbrev')}</label>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={sinColor} onChange={e => setSinColor(e.target.checked)} /> {t('opt_no_color')}</label>
                {view === 'grado' && (
                    <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={ocultarProfesor} onChange={e => setOcultarProfesor(e.target.checked)} /> {t('opt_hide_teachers')}</label>
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