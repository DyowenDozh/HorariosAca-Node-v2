// Teacher Service - Business logic for teacher operations
// BUG-001 (corregido): verifica propietario vía teachers -> schedules.user_id.
const pool = require('../config/db');

const userOwnsSchedule = async (userId, scheduleId) => {
    const [rows] = await pool.query(
        'SELECT schedule_id FROM schedules WHERE schedule_id = ? AND user_id = ?',
        [scheduleId, userId]
    );
    return rows.length > 0;
};

const getAllTeachers = async (userId, scheduleId) => {
    try {
        const [rows] = await pool.query(
            `SELECT t.* FROM teachers t
             JOIN schedules sc ON sc.schedule_id = t.schedule_id
             WHERE t.schedule_id = ? AND sc.user_id = ?`,
            [scheduleId, userId]
        );
        return rows;
    } catch (error) {
        throw new Error('Error retrieving teachers: ' + error.message);
    }
};

const getTeacherById = async (userId, id) => {
    try {
        const [rows] = await pool.query(
            `SELECT t.* FROM teachers t
             JOIN schedules sc ON sc.schedule_id = t.schedule_id
             WHERE t.teacher_id = ? AND sc.user_id = ?`,
            [id, userId]
        );
        return rows[0] || null;
    } catch (error) {
        throw new Error('Error retrieving teacher: ' + error.message);
    }
};

const createTeacher = async (userId, teacher_name, amount_hour, scheduleId) => {
    try {
        if (!(await userOwnsSchedule(userId, scheduleId))) return null;
        const [result] = await pool.query(
            'INSERT INTO teachers (teacher_name, amount_hour, schedule_id) VALUES (?, ?, ?)',
            [teacher_name, amount_hour || 0, scheduleId]
        );
        return { teacher_id: result.insertId, teacher_name, amount_hour: amount_hour || 0, schedule_id: scheduleId };
    } catch (error) {
        throw new Error('Error creating teacher: ' + error.message);
    }
};

const updateTeacher = async (userId, id, teacher_name, amount_hour) => {
    try {
        const [result] = await pool.query(
            `UPDATE teachers SET teacher_name = ?, amount_hour = ?
             WHERE teacher_id = ?
               AND schedule_id IN (SELECT schedule_id FROM schedules WHERE user_id = ?)`,
            [teacher_name, amount_hour, id, userId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error updating teacher: ' + error.message);
    }
};

const deleteTeacher = async (userId, id) => {
    try {
        const [result] = await pool.query(
            `DELETE FROM teachers
             WHERE teacher_id = ?
               AND schedule_id IN (SELECT schedule_id FROM schedules WHERE user_id = ?)`,
            [id, userId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error deleting teacher: ' + error.message);
    }
};

module.exports = { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher };
