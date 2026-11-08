// GradeSubject Service - Malla curricular de un grado (materias + horas)
const pool = require('../config/db');

// Lee la malla de un grado: materias asignadas con sus horas (y profesor si lo hay)
const getByGrade = async (gradeId) => {
    const [rows] = await pool.query(
        `SELECT gs.grade_subject_id, gs.subject_id, gs.weekly_hours, gs.teacher_id,
                s.subject_name, s.abbreviation, s.color_id,
                COALESCE(
                    t_direct.teacher_name,
                    (SELECT t2.teacher_name
                       FROM teacher_grade_rules tgr
                       JOIN teachers t2 ON t2.teacher_id = tgr.teacher_id
                      WHERE tgr.grade_id = gs.grade_id
                        AND tgr.subject_id = gs.subject_id
                        AND tgr.rule = 'DEBE'
                      LIMIT 1)
                ) AS teacher_name
         FROM grade_subjects gs
         JOIN subjects s ON s.subject_id = gs.subject_id
         LEFT JOIN teachers t_direct ON t_direct.teacher_id = gs.teacher_id
         WHERE gs.grade_id = ?
         ORDER BY gs.grade_subject_id`,
        [gradeId]
    );
    return rows;
};

// Reemplaza toda la malla de un grado (borra y vuelve a insertar) en una transacción
const replaceForGrade = async (gradeId, items) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM grade_subjects WHERE grade_id = ?', [gradeId]);
        for (const it of (items || [])) {
            await conn.query(
                'INSERT INTO grade_subjects (grade_id, subject_id, weekly_hours, teacher_id) VALUES (?, ?, ?, ?)',
                [gradeId, it.subject_id, it.weekly_hours || 0, it.teacher_id || null]
            );
        }
        await conn.commit();
        return true;
    } catch (error) {
        await conn.rollback();
        throw new Error('Error saving grade curriculum: ' + error.message);
    } finally {
        conn.release();
    }
};

module.exports = { getByGrade, replaceForGrade };
