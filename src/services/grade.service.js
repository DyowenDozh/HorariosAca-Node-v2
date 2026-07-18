// Grade Service - Business logic for grade operations
const pool = require('../config/db');

// Get all grades
const getAllGrades = async () => {
    try {
        const [rows] = await pool.query('SELECT * FROM grades');
        return rows;
    } catch (error) {
        throw new Error('Error retrieving grades: ' + error.message);
    }
};

// Get grade by ID
const getGradeById = async (id) => {
    try {
        const [rows] = await pool.query('SELECT * FROM grades WHERE grade_id = ?', [id]);
        return rows[0] || null;
    } catch (error) {
        throw new Error('Error retrieving grade: ' + error.message);
    }
};

// Create new grade
const createGrade = async (grade_name) => {
    try {
        const [result] = await pool.query(
            'INSERT INTO grades (grade_name) VALUES (?)',
            [grade_name]
        );
        return { grade_id: result.insertId, grade_name };
    } catch (error) {
        throw new Error('Error creating grade: ' + error.message);
    }
};

// Update grade
const updateGrade = async (id, grade_name) => {
    try {
        const [result] = await pool.query(
            'UPDATE grades SET grade_name = ? WHERE grade_id = ?',
            [grade_name, id]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error updating grade: ' + error.message);
    }
};

// Delete grade
const deleteGrade = async (id) => {
    try {
        const [result] = await pool.query('DELETE FROM grades WHERE grade_id = ?', [id]);
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error deleting grade: ' + error.message);
    }
};

module.exports = { getAllGrades, getGradeById, createGrade, updateGrade, deleteGrade };