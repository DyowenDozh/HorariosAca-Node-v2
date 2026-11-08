// Grade Service - Business logic for grade operations
// BUG-001 (corregido): verifica propietario vía grades -> schedules.user_id.
const pool = require('../config/db');

const userOwnsSchedule = async (userId, scheduleId) => {
    const [rows] = await pool.query(
        'SELECT schedule_id FROM schedules WHERE schedule_id = ? AND user_id = ?',
        [scheduleId, userId]
    );
    return rows.length > 0;
};

const getAllGrades = async (userId, scheduleId) => {
    try {
        const [rows] = await pool.query(
            `SELECT g.* FROM grades g
             JOIN schedules sc ON sc.schedule_id = g.schedule_id
             WHERE g.schedule_id = ? AND sc.user_id = ?`,
            [scheduleId, userId]
        );
        return rows;
    } catch (error) {
        throw new Error('Error retrieving grades: ' + error.message);
    }
};

const getGradeById = async (userId, id) => {
    try {
        const [rows] = await pool.query(
            `SELECT g.* FROM grades g
             JOIN schedules sc ON sc.schedule_id = g.schedule_id
             WHERE g.grade_id = ? AND sc.user_id = ?`,
            [id, userId]
        );
        return rows[0] || null;
    } catch (error) {
        throw new Error('Error retrieving grade: ' + error.message);
    }
};

const createGrade = async (userId, grade_name, scheduleId) => {
    try {
        if (!(await userOwnsSchedule(userId, scheduleId))) return null;
        const [result] = await pool.query(
            'INSERT INTO grades (grade_name, schedule_id) VALUES (?, ?)',
            [grade_name, scheduleId]
        );
        return { grade_id: result.insertId, grade_name, schedule_id: scheduleId };
    } catch (error) {
        throw new Error('Error creating grade: ' + error.message);
    }
};

const updateGrade = async (userId, id, grade_name) => {
    try {
        const [result] = await pool.query(
            `UPDATE grades SET grade_name = ?
             WHERE grade_id = ?
               AND schedule_id IN (SELECT schedule_id FROM schedules WHERE user_id = ?)`,
            [grade_name, id, userId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error updating grade: ' + error.message);
    }
};

const deleteGrade = async (userId, id) => {
    try {
        const [result] = await pool.query(
            `DELETE FROM grades
             WHERE grade_id = ?
               AND schedule_id IN (SELECT schedule_id FROM schedules WHERE user_id = ?)`,
            [id, userId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error deleting grade: ' + error.message);
    }
};

module.exports = { getAllGrades, getGradeById, createGrade, updateGrade, deleteGrade };
