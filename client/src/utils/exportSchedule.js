// Exportación del horario generado a PDF (3 archivos) y Excel (3 hojas).
// Vistas: Grados, General (resumen compacto) y Profesores.
// Opciones: siglas vs nombre, sin color, ocultar profesores (vista estudiante).
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// ---------- Color ----------
function hexToRgb(hex) {
    if (!hex) return null;
    const h = String(hex).replace('#', '');
    if (h.length !== 6) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function tintRgb(rgb, f = 0.82) { return [Math.round(rgb[0] + (255 - rgb[0]) * f), Math.round(rgb[1] + (255 - rgb[1]) * f), Math.round(rgb[2] + (255 - rgb[2]) * f)]; }
function rgbToHex([r, g, b]) { const h = (n) => n.toString(16).padStart(2, '0'); return (h(r) + h(g) + h(b)).toUpperCase(); }
function tintHex(hex) { const rgb = hexToRgb(hex); return rgb ? '#' + rgbToHex(tintRgb(rgb)) : null; }

// ---------- Índice de celdas ----------
function indexByGrade(rows) { const m = new Map(); for (const r of rows) m.set(`${r.grade_id}|${r.day_key}|${r.hour_index}`, r); return m; }

// ---------- Construcción de tablas (estructura neutra) ----------
// Cada celda: { text, bg (hex o null), hour?, off? }
function gradeTable(idx, grade, meta, opts) {
    const L = opts.labels || {};
    const maxH = Math.max(...meta.days.map(d => d.hours));
    const head = [L.hour || 'Hora', ...meta.days.map(d => d.label)];
    const body = [];
    for (let h = 0; h < maxH; h++) {
        const row = [{ text: String(h + 1), bg: null, hour: true }];
        for (const d of meta.days) {
            if (h >= d.hours) { row.push({ text: '', bg: null, off: true }); continue; }
            const c = idx.get(`${grade.id}|${d.key}|${h}`);
            if (!c) { row.push({ text: '', bg: null }); continue; }
            const name = opts.siglas ? (c.abbreviation || c.subject_name) : c.subject_name;
            const text = opts.ocultarProfesor ? name : (name + (c.teacher_name ? '\n' + c.teacher_name : ''));
            row.push({ text, bg: opts.sinColor ? null : tintHex(c.color_id) });
        }
        body.push(row);
    }
    return { title: (L.grade || 'Grado') + ' ' + grade.name, head, body };
}

function teacherTable(rows, teacher, meta, opts) {
    const L = opts.labels || {};
    const tm = new Map(); for (const r of rows) if (r.teacher_id === teacher.id) tm.set(`${r.day_key}|${r.hour_index}`, r);
    const maxH = Math.max(...meta.days.map(d => d.hours));
    const head = [L.hour || 'Hora', ...meta.days.map(d => d.label)];
    const body = [];
    for (let h = 0; h < maxH; h++) {
        const row = [{ text: String(h + 1), bg: null, hour: true }];
        for (const d of meta.days) {
            if (h >= d.hours) { row.push({ text: '', bg: null, off: true }); continue; }
            const c = tm.get(`${d.key}|${h}`);
            if (!c) { row.push({ text: '', bg: null }); continue; }
            const name = opts.siglas ? (c.abbreviation || c.subject_name) : c.subject_name;
            row.push({ text: (c.grade_name || '') + ' ' + name, bg: opts.sinColor ? null : tintHex(c.color_id) });
        }
        body.push(row);
    }
    return { title: (L.teacher || 'Profesor') + ' ' + teacher.name, head, body };
}

function generalTable(idx, meta, opts) {
    const L = opts.labels || {};
    const head = [L.grade || 'Grado', ...meta.days.map(d => d.label)];
    const body = [];
    for (const g of meta.grades) {
        const row = [{ text: g.name, bg: null, hour: true }];
        for (const d of meta.days) {
            const parts = [];
            for (let h = 0; h < d.hours; h++) { const c = idx.get(`${g.id}|${d.key}|${h}`); if (c) parts.push(opts.siglas ? (c.abbreviation || c.subject_name) : c.subject_name); }
            row.push({ text: parts.join('\n'), bg: null });
        }
        body.push(row);
    }
    return { title: L.general || 'Horario general', head, body };
}

// meta: { days:[{key,label,hours}], grades:[{id,name}], teachers:[{id,name}] }
function buildTables(rows, meta, opts) {
    const idx = indexByGrade(rows);
    return {
        grados: meta.grades.map(g => gradeTable(idx, g, meta, opts)),
        general: [generalTable(idx, meta, opts)],
        profesores: meta.teachers.map(t => teacherTable(rows, t, meta, opts)),
    };
}

// ---------- Descargar un Blob ----------
function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// ---------- PDF ----------
function cellStyles(c) {
    const s = {};
    if (c.hour) { s.fontStyle = 'bold'; s.fillColor = [243, 243, 250]; }
    if (c.off) { s.fillColor = [235, 235, 235]; }
    if (c.bg) { const rgb = hexToRgb(c.bg); if (rgb) s.fillColor = rgb; }
    return s;
}
// Dibuja un cuadro elegante con los datos del horario. Devuelve la Y donde seguir.
function pdfHeaderBlock(doc, header, L) {
    if (!header) return 36; // sin datos: título como antes
    const pageW = doc.internal.pageSize.getWidth();
    const x = 40, w = pageW - 80;
    // Banda de título (morado oscuro)
    doc.setFillColor(46, 42, 107);
    doc.rect(x, 20, w, 24, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont(undefined, 'bold'); doc.setFontSize(14);
    doc.text(`${L.hdrTitle || 'Horario'}: ${header.name || '—'}`, x + 10, 36);
    // Sub-banda de datos (lila claro)
    doc.setFillColor(237, 235, 250);
    doc.rect(x, 44, w, 18, 'F');
    doc.setTextColor(60, 47, 143); doc.setFont(undefined, 'normal'); doc.setFontSize(9.5);
    const line = `${L.hdrInstitution || 'Institución'}: ${header.institution || '—'}        `
        + `${L.hdrYear || 'Año escolar'}: ${header.schoolYear || '—'}        `
        + `${L.hdrJourney || 'Jornada'}: ${header.journey || '—'}`;
    doc.text(line, x + 10, 56);
    doc.setTextColor(40, 40, 40); // restaurar color
    return 70;
}
function tablesToPdf(tables, filename, header, L) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    let first = true;
    for (const tb of tables) {
        if (!first) doc.addPage(); first = false;
        const topY = pdfHeaderBlock(doc, header, L || {});
        doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.text(tb.title, 40, topY + 12);
        doc.setFont(undefined, 'normal');
        doc.autoTable({
            startY: topY + 22,
            head: [tb.head],
            body: tb.body.map(r => r.map(c => ({ content: c.text, styles: cellStyles(c) }))),
            styles: { fontSize: 8, cellPadding: 3, valign: 'middle', halign: 'center', lineWidth: 0.5, lineColor: [210, 210, 210], textColor: [40, 40, 40] },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
            theme: 'grid',
        });
    }
    doc.save(filename);
}

export function exportPdfs(rows, meta, opts) {
    const L = opts.labels || {};
    const t = buildTables(rows, meta, opts);
    tablesToPdf(t.grados, L.pdfGrades || 'Horario-por-grados.pdf', meta.header, L);
    tablesToPdf(t.general, L.pdfGeneral || 'Horario-general.pdf', meta.header, L);
    tablesToPdf(t.profesores, L.pdfTeachers || 'Horario-por-profesores.pdf', meta.header, L);
}

// ---------- Excel ----------
function writeTablesToSheet(ws, tables) {
    for (const tb of tables) {
        ws.addRow([tb.title]);
        const titleRow = ws.lastRow; titleRow.font = { bold: true, size: 12 };
        const head = ws.addRow(tb.head);
        head.eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } }; cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.border = thin(); });
        for (const r of tb.body) {
            const row = ws.addRow(r.map(c => c.text));
            row.eachCell((cell, col) => {
                const c = r[col - 1];
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = thin();
                if (c.hour) { cell.font = { bold: true }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F3FA' } }; }
                else if (c.off) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEBEB' } }; }
                else if (c.bg) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + c.bg.replace('#', '') } }; }
            });
        }
        ws.addRow([]); // separador
    }
    // anchos de columna
    ws.columns.forEach((col, i) => { col.width = i === 0 ? 10 : 20; });
}
function thin() { return { top: { style: 'thin', color: { argb: 'FFD2D2D2' } }, left: { style: 'thin', color: { argb: 'FFD2D2D2' } }, bottom: { style: 'thin', color: { argb: 'FFD2D2D2' } }, right: { style: 'thin', color: { argb: 'FFD2D2D2' } } }; }

// Cuadro elegante con los datos del horario en la parte superior de la hoja.
function writeHeaderToSheet(ws, header, L, cols) {
    if (!header) return;
    const last = Math.max(2, cols || 2);
    const NAVY = 'FF2E2A6B', LILAC = 'FFEDEBFA', SOFT = 'FFF7F6FD';
    const bd = thin();
    const center = { horizontal: 'center', vertical: 'middle' };

    // Fila 1: nombre del horario (banda oscura)
    const r1 = ws.addRow([`${L.hdrTitle || 'Horario'}: ${header.name || '—'}`]);
    ws.mergeCells(r1.number, 1, r1.number, last); r1.height = 26;
    const c1 = r1.getCell(1);
    c1.font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' } };
    c1.alignment = center; c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };

    // Fila 2: institución (banda lila)
    const r2 = ws.addRow([`${L.hdrInstitution || 'Institución'}: ${header.institution || '—'}`]);
    ws.mergeCells(r2.number, 1, r2.number, last); r2.height = 20;
    const c2 = r2.getCell(1);
    c2.font = { bold: true, size: 11, color: { argb: 'FF3C2F8F' } };
    c2.alignment = center; c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LILAC } };

    // Fila 3: año | jornada (dos mitades)
    const r3 = ws.addRow([]); r3.height = 20;
    const mid = Math.max(1, Math.floor(last / 2));
    ws.mergeCells(r3.number, 1, r3.number, mid);
    ws.mergeCells(r3.number, mid + 1, r3.number, last);
    const cl = r3.getCell(1), cr = r3.getCell(mid + 1);
    cl.value = `${L.hdrYear || 'Año escolar'}: ${header.schoolYear || '—'}`;
    cr.value = `${L.hdrJourney || 'Jornada'}: ${header.journey || '—'}`;
    for (const cc of [cl, cr]) { cc.font = { size: 11, color: { argb: 'FF333333' } }; cc.alignment = center; cc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } }; }

    // Bordes del cuadro
    for (const rr of [r1, r2, r3]) for (let col = 1; col <= last; col++) rr.getCell(col).border = bd;
    ws.addRow([]); // separador
}
export async function exportExcel(rows, meta, opts) {
    const L = opts.labels || {};
    const t = buildTables(rows, meta, opts);
    const cols = 1 + (meta.days ? meta.days.length : 0);
    const wb = new ExcelJS.Workbook();
    const wsG = wb.addWorksheet(L.sheetGrades || 'Grados'); writeHeaderToSheet(wsG, meta.header, L, cols); writeTablesToSheet(wsG, t.grados);
    const wsGen = wb.addWorksheet(L.sheetGeneral || 'General'); writeHeaderToSheet(wsGen, meta.header, L, cols); writeTablesToSheet(wsGen, t.general);
    const wsT = wb.addWorksheet(L.sheetTeachers || 'Profesores'); writeHeaderToSheet(wsT, meta.header, L, cols); writeTablesToSheet(wsT, t.profesores);
    const buf = await wb.xlsx.writeBuffer();
    download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), L.fileName || 'Horario.xlsx');
}

// Exporto helpers de construcción por si la vista en pantalla los reutiliza.
export { buildTables };