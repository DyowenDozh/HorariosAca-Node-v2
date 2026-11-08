// Subject Service - logica de negocio for subject operations
// BUG-001 (corregido): todas las operaciones verifican que la asignatura
// pertenezca a un horario del usuario autenticado (subjects -> schedules.user_id).
const pool = require('../config/db');

// Verifica que un horario pertenezca al usuario
const userOwnsSchedule = async (userId, scheduleId) => {
    const [rows] = await pool.query(
        'SELECT schedule_id FROM schedules WHERE schedule_id = ? AND user_id = ?',
        [scheduleId, userId]
    );
    return rows.length > 0;
};

// Get all subjects (solo del horario del usuario)
const getAllSubjects = async (userId, scheduleId) => {
    try {
        const [rows] = await pool.query(
            `SELECT s.* FROM subjects s
             JOIN schedules sc ON sc.schedule_id = s.schedule_id
             WHERE s.schedule_id = ? AND sc.user_id = ?`,
            [scheduleId, userId]
        );
        return rows;
    } catch (error) {
        throw new Error('Error retrieving subjects: ' + error.message);
    }
};

// Get subject by ID (solo si es del usuario)
const getSubjectById = async (userId, id) => {
    try {
        const [rows] = await pool.query(
            `SELECT s.* FROM subjects s
             JOIN schedules sc ON sc.schedule_id = s.schedule_id
             WHERE s.subject_id = ? AND sc.user_id = ?`,
            [id, userId]
        );
        return rows[0] || null;
    } catch (error) {
        throw new Error('Error retrieving subject: ' + error.message);
    }
};

// Create new subject (solo en un horario propio)
const createSubject = async (userId, subject_name, color_id, abbreviation, scheduleId) => {
    try {
        if (!(await userOwnsSchedule(userId, scheduleId))) return null; // no es dueño del horario
        const [result] = await pool.query(
            'INSERT INTO subjects (subject_name, color_id, abbreviation, schedule_id) VALUES (?, ?, ?, ?)',
            [subject_name, color_id || '#FFFFFF', abbreviation || '', scheduleId]
        );
        return { subject_id: result.insertId, subject_name, color_id: color_id || '#FFFFFF', abbreviation: abbreviation || '', schedule_id: scheduleId };
    } catch (error) {
        throw new Error('Error creating subject: ' + error.message);
    }
};

// Update subject (solo si es del usuario)
const updateSubject = async (userId, id, subject_name, color_id, abbreviation) => {
    try {
        const [result] = await pool.query(
            `UPDATE subjects SET subject_name = ?, color_id = ?, abbreviation = ?
             WHERE subject_id = ?
               AND schedule_id IN (SELECT schedule_id FROM schedules WHERE user_id = ?)`,
            [subject_name, color_id, abbreviation || '', id, userId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error updating subject: ' + error.message);
    }
};

// Delete subject (solo si es del usuario)
const deleteSubject = async (userId, id) => {
    try {
        const [result] = await pool.query(
            `DELETE FROM subjects
             WHERE subject_id = ?
               AND schedule_id IN (SELECT schedule_id FROM schedules WHERE user_id = ?)`,
            [id, userId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error deleting subject: ' + error.message);
    }
};

module.exports = { getAllSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };
