// PrefDetail Service - Preferencias detalladas por (grado, materia) de un horario
const pool = require('../config/db');

// Construye las filas de preferencias detalladas: todas las materias de cada grado
// del horario, con su profesor DEBE (si lo hay), horas de la malla y la config guardada.
const getRows = async (scheduleId) => {
    const [rows] = await pool.query(
        `SELECT g.grade_id, g.grade_name, s.subject_id, s.subject_name, s.color_id,
                gs.weekly_hours,
                t.teacher_id, t.teacher_name,
                spd.\`grouping\`
         FROM grades g
         JOIN grade_subjects gs ON gs.grade_id = g.grade_id
         JOIN subjects s ON s.subject_id = gs.subject_id
         LEFT JOIN teacher_grade_rules tgr
                ON tgr.grade_id = g.grade_id AND tgr.subject_id = s.subject_id AND tgr.rule = 'DEBE'
         LEFT JOIN teachers t ON t.teacher_id = tgr.teacher_id
         LEFT JOIN schedule_pref_details spd
                ON spd.schedule_id = ? AND spd.grade_id = g.grade_id AND spd.subject_id = s.subject_id
         WHERE g.schedule_id = ?
         ORDER BY g.grade_name, s.subject_name`,
        [scheduleId, scheduleId]
    );
    return rows;
};

// Reemplaza las preferencias detalladas del horario
const saveRows = async (scheduleId, items) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM schedule_pref_details WHERE schedule_id = ?', [scheduleId]);
        for (const it of (items || [])) {
            if (!it.grouping || it.grouping === 'NONE') continue; // no guardar los "sin especificar"
            await conn.query(
                'INSERT INTO schedule_pref_details (schedule_id, grade_id, subject_id, `grouping`) VALUES (?, ?, ?, ?)',
                [scheduleId, it.grade_id, it.subject_id, it.grouping]
            );
        }
        await conn.commit();
        return true;
    } catch (error) {
        await conn.rollback();
        throw new Error('Error saving preference details: ' + error.message);
    } finally {
        conn.release();
    }
};

module.exports = { getRows, saveRows };
