// Teacher Service - Business logic for teacher operations
const pool = require('../config/db');

// Get all teachers
const getAllTeachers = async () => {
    try {
        const [rows] = await pool.query('SELECT * FROM teachers');
        return rows;
    } catch (error) {
        throw new Error('Error retrieving teachers: ' + error.message);
    }
};

// Get teacher by ID
const getTeacherById = async (id) => {
    try {
        const [rows] = await pool.query('SELECT * FROM teachers WHERE teacher_id = ?', [id]);
        return rows[0] || null;
    } catch (error) {
        throw new Error('Error retrieving teacher: ' + error.message);
    }
};

// Create new teacher
const createTeacher = async (teacher_name, amount_hour) => {
    try {
        const [result] = await pool.query(
            'INSERT INTO teachers (teacher_name, amount_hour) VALUES (?, ?)',
            [teacher_name, amount_hour || 0]
        );
        return { teacher_id: result.insertId, teacher_name, amount_hour: amount_hour || 0 };
    } catch (error) {
        throw new Error('Error creating teacher: ' + error.message);
    }
};

// Update teacher
const updateTeacher = async (id, teacher_name, amount_hour) => {
    try {
        const [result] = await pool.query(
            'UPDATE teachers SET teacher_name = ?, amount_hour = ? WHERE teacher_id = ?',
            [teacher_name, amount_hour, id]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error updating teacher: ' + error.message);
    }
};

// Delete teacher
const deleteTeacher = async (id) => {
    try {
        const [result] = await pool.query('DELETE FROM teachers WHERE teacher_id = ?', [id]);
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error deleting teacher: ' + error.message);
    }
};

module.exports = { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher };