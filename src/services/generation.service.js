// Generation Service - Puente entre la BD y el motor de generación (Etapa 1)
// Lee la configuración real del horario, ejecuta el motor y guarda el resultado.
const pool = require('../config/db');
const { generateSchedule } = require('./generator');

const DAY_ORDER = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

// Construye la lista de días laborales con su número de franjas de clase.
// Toma la config de schedule_days; si el modo es 'uniform', usa la fila 'all'
// para todos los días marcados como laborales en la propia tabla.
async function buildDays(scheduleId) {
    const [rows] = await pool.query(
        'SELECT day_key, is_working, hours_per_day FROM schedule_days WHERE schedule_id = ?',
        [scheduleId]
    );
    const byKey = {};
    rows.forEach(r => { byKey[r.day_key] = r; });

    const days = [];
    const uniform = byKey['all'];
    for (const dk of DAY_ORDER) {
        const row = byKey[dk];
        // Un día cuenta si está marcado como laboral
        if (row && row.is_working) {
            const hours = uniform ? uniform.hours_per_day : row.hours_per_day;
            if (hours > 0) days.push({ day_key: dk, hours });
        }
    }
    return days;
}

// Reúne todos los datos y ejecuta el motor
const generate = async (userId, scheduleId) => {
    // Verificar pertenencia
    const [own] = await pool.query(
        'SELECT schedule_id FROM schedules WHERE schedule_id = ? AND user_id = ?',
        [scheduleId, userId]
    );
    if (own.length === 0) return { ok: false, reason: 'Horario no encontrado.' };

    // 1. Días y franjas (Fase 1)
    const days = await buildDays(scheduleId);
    if (days.length === 0) return { ok: false, reason: 'El horario no tiene días laborales configurados (Fase 1).' };

    // 2. Grados del horario
    const [grades] = await pool.query('SELECT grade_id, grade_name FROM grades WHERE schedule_id = ?', [scheduleId]);
    if (grades.length === 0) return { ok: false, reason: 'El horario no tiene grados (Fase 3).' };

    // 3. Demanda: malla de cada grado (grade_subjects)
    const [demands] = await pool.query(
        `SELECT gs.grade_id, gs.subject_id, gs.weekly_hours
         FROM grade_subjects gs
         JOIN grades g ON g.grade_id = gs.grade_id
         WHERE g.schedule_id = ? AND gs.weekly_hours > 0`,
        [scheduleId]
    );
    if (demands.length === 0) return { ok: false, reason: 'Ningún grado tiene materias con horas asignadas (Fase 3).' };

    // 4. Profesores del horario
    const [teachers] = await pool.query('SELECT teacher_id, teacher_name FROM teachers WHERE schedule_id = ?', [scheduleId]);

    // 5. Qué materia imparte cada profesor (teacher_subjects)
    const [ts] = await pool.query(
        `SELECT ts.teacher_id, ts.subject_id
         FROM teacher_subjects ts
         JOIN teachers t ON t.teacher_id = ts.teacher_id
         WHERE t.schedule_id = ?`, [scheduleId]
    );
    const canTeach = {};
    ts.forEach(r => { canTeach[`${r.teacher_id}-${r.subject_id}`] = true; });

    // 6. Reglas por grado (teacher_grade_rules): DEBE / NO
    const [rl] = await pool.query(
        `SELECT tgr.teacher_id, tgr.subject_id, tgr.grade_id, tgr.rule
         FROM teacher_grade_rules tgr
         JOIN teachers t ON t.teacher_id = tgr.teacher_id
         WHERE t.schedule_id = ?`, [scheduleId]
    );
    const rules = {};
    rl.forEach(r => { rules[`${r.teacher_id}-${r.subject_id}-${r.grade_id}`] = r.rule; });

    // 7. Preferencias detalladas (Fase 5)
    const [prefRows] = await pool.query(
        'SELECT grade_id, subject_id, `grouping` FROM schedule_pref_details WHERE schedule_id = ?',
        [scheduleId]
    );

    const prefDetails = prefRows.map(r => ({
        grade_id: r.grade_id, subject_id: r.subject_id, grouping: r.grouping,
    }));

    // 8. Disponibilidad (franjas ND) y límites diarios de los profesores
    const [availRows] = await pool.query(
        `SELECT ta.teacher_id, ta.day_key, ta.hour_index
         FROM teacher_availability ta
         JOIN teachers t ON t.teacher_id = ta.teacher_id
         WHERE t.schedule_id = ? AND ta.status = 'ND'`,
        [scheduleId]
    );
    const availability = availRows.map(r => ({ teacher_id: r.teacher_id, day_key: r.day_key, hour_index: r.hour_index }));

    const [limitRows] = await pool.query(
        `SELECT tdl.teacher_id, tdl.day_key, tdl.max_hours
         FROM teacher_day_limits tdl
         JOIN teachers t ON t.teacher_id = tdl.teacher_id
         WHERE t.schedule_id = ? AND tdl.max_hours > 0`,
        [scheduleId]
    );
    const dayLimits = limitRows.map(r => ({ teacher_id: r.teacher_id, day_key: r.day_key, max_hours: r.max_hours }));

    // --- Ejecutar el motor ---
    const result = generateSchedule({ days, grades, demands, teachers, canTeach, rules, prefDetails, availability, dayLimits, seed: Date.now() & 0x7fffffff });
    if (!result.ok) return result;

    // --- Guardar el resultado en generated_classes (reemplaza el anterior) ---
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM generated_classes WHERE schedule_id = ?', [scheduleId]);
        for (const p of result.placements) {
            await conn.query(
                'INSERT INTO generated_classes (schedule_id, grade_id, subject_id, teacher_id, day_key, hour_index) VALUES (?, ?, ?, ?, ?, ?)',
                [scheduleId, p.grade_id, p.subject_id, p.teacher_id || null, p.day_key, p.hour_index]
            );
        }
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw new Error('Error guardando el horario generado: ' + error.message);
    } finally {
        conn.release();
    }

    return {
        ok: true,
        total: result.placements.length,
        stats: result.stats,
        warning: result.warning || null,
        relaxed: !!result.relaxed,
        unplaced: result.unplaced ? result.unplaced.length : 0,
    };
};

// Devuelve el horario generado (para mostrarlo)
const getGenerated = async (userId, scheduleId) => {
    const [own] = await pool.query('SELECT schedule_id FROM schedules WHERE schedule_id = ? AND user_id = ?', [scheduleId, userId]);
    if (own.length === 0) return null;
    const [rows] = await pool.query(
        `SELECT gc.grade_id, g.grade_name, gc.subject_id, s.subject_name, s.color_id, s.abbreviation,
                gc.teacher_id, t.teacher_name, gc.day_key, gc.hour_index
         FROM generated_classes gc
         JOIN grades g   ON g.grade_id = gc.grade_id
         JOIN subjects s ON s.subject_id = gc.subject_id
         LEFT JOIN teachers t ON t.teacher_id = gc.teacher_id
         WHERE gc.schedule_id = ?
         ORDER BY gc.grade_id, gc.day_key, gc.hour_index`,
        [scheduleId]
    );
    return rows;
};

module.exports = { generate, getGenerated };