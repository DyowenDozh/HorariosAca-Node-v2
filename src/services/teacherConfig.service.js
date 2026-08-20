// TeacherConfig Service - Configuración avanzada del profesor (Fase 4)
const pool = require('../config/db');

// Carga toda la config de un profesor
const getConfig = async (teacherId) => {
    const [subjects] = await pool.query(
        `SELECT ts.subject_id, s.subject_name, s.color_id, s.abbreviation
         FROM teacher_subjects ts JOIN subjects s ON s.subject_id = ts.subject_id
         WHERE ts.teacher_id = ?`, [teacherId]
    );
    const [availability] = await pool.query(
        'SELECT day_key, hour_index, status FROM teacher_availability WHERE teacher_id = ?', [teacherId]
    );
    const [dayLimits] = await pool.query(
        'SELECT day_key, max_hours FROM teacher_day_limits WHERE teacher_id = ?', [teacherId]
    );
    const [rules] = await pool.query(
        'SELECT subject_id, grade_id, rule FROM teacher_grade_rules WHERE teacher_id = ?', [teacherId]
    );
    return { subjects, availability, dayLimits, rules };
};

// Guarda (reemplaza) toda la config del profesor en una transacción
const saveConfig = async (teacherId, payload) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Materias del profesor
        await conn.query('DELETE FROM teacher_subjects WHERE teacher_id = ?', [teacherId]);
        for (const sid of (payload.subjectIds || [])) {
            await conn.query('INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)', [teacherId, sid]);
        }

        // Disponibilidad (solo las ND marcadas)
        await conn.query('DELETE FROM teacher_availability WHERE teacher_id = ?', [teacherId]);
        for (const a of (payload.availability || [])) {
            await conn.query(
                'INSERT INTO teacher_availability (teacher_id, day_key, hour_index, status) VALUES (?, ?, ?, ?)',
                [teacherId, a.day_key, a.hour_index, a.status || 'ND']
            );
        }

        // Límites diarios
        await conn.query('DELETE FROM teacher_day_limits WHERE teacher_id = ?', [teacherId]);
        for (const dl of (payload.dayLimits || [])) {
            await conn.query(
                'INSERT INTO teacher_day_limits (teacher_id, day_key, max_hours) VALUES (?, ?, ?)',
                [teacherId, dl.day_key, dl.max_hours || 0]
            );
        }

        // Reglas por grado/materia
        await conn.query('DELETE FROM teacher_grade_rules WHERE teacher_id = ?', [teacherId]);
        for (const r of (payload.rules || [])) {
            await conn.query(
                'INSERT INTO teacher_grade_rules (teacher_id, subject_id, grade_id, rule) VALUES (?, ?, ?, ?)',
                [teacherId, r.subject_id, r.grade_id, r.rule || 'PODRA']
            );
        }

        await conn.commit();
        return true;
    } catch (error) {
        await conn.rollback();
        throw new Error('Error saving teacher config: ' + error.message);
    } finally {
        conn.release();
    }
};

// Contexto del horario para la ficha de un profesor:
// - horas de cada materia en cada grado (de las mallas curriculares)
// - reglas DEBE de OTROS profesores (para bloquear grados ya tomados)
const getScheduleContext = async (scheduleId, excludeTeacherId) => {
    // Horas por (grade_id, subject_id) según grade_subjects, filtrando por horario
    const [mallas] = await pool.query(
        `SELECT gs.grade_id, gs.subject_id, gs.weekly_hours
         FROM grade_subjects gs
         JOIN grades g ON g.grade_id = gs.grade_id
         WHERE g.schedule_id = ?`,
        [scheduleId]
    );
    // Reglas DEBE de otros profesores del mismo horario
    const [takenRows] = await pool.query(
        `SELECT tgr.subject_id, tgr.grade_id, tgr.teacher_id, t.teacher_name
         FROM teacher_grade_rules tgr
         JOIN teachers t ON t.teacher_id = tgr.teacher_id
         WHERE t.schedule_id = ? AND tgr.rule = 'DEBE' AND tgr.teacher_id <> ?`,
        [scheduleId, excludeTeacherId || 0]
    );
    return { mallas, taken: takenRows };
};

module.exports = { getConfig, saveConfig, getScheduleContext };