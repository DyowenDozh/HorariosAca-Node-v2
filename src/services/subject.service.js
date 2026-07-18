// Subject Service - logica de negocio for subject operations
const pool = require('../config/db');

// Get all subjects
const getAllSubjects = async () => {
    try {
        const [rows] = await pool.query('SELECT * FROM subjects');
        return rows;
    } catch (error) {
        throw new Error('Error retrieving subjects: ' + error.message);
    }
};

// Get subject by ID
const getSubjectById = async (id) => {
    try {
        const [rows] = await pool.query('SELECT * FROM subjects WHERE subject_id = ?', [id]);
        return rows[0] || null;
    } catch (error) {
        throw new Error('Error retrieving subject: ' + error.message);
    }
};

// Create new subject
const createSubject = async (subject_name, color_id) => {
    try {
        const [result] = await pool.query(
            'INSERT INTO subjects (subject_name, color_id) VALUES (?, ?)',
            [subject_name, color_id || '#FFFFFF']
        );
        return { subject_id: result.insertId, subject_name, color_id: color_id || '#FFFFFF' };
    } catch (error) {
        throw new Error('Error creating subject: ' + error.message);
    }
};

// Update subject
const updateSubject = async (id, subject_name, color_id) => {
    try {
        const [result] = await pool.query(
            'UPDATE subjects SET subject_name = ?, color_id = ? WHERE subject_id = ?',
            [subject_name, color_id, id]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error updating subject: ' + error.message);
    }
};

// Delete subject
const deleteSubject = async (id) => {
    try {
        const [result] = await pool.query('DELETE FROM subjects WHERE subject_id = ?', [id]);
        return result.affectedRows > 0;
    } catch (error) {
        throw new Error('Error deleting subject: ' + error.message);
    }
};

module.exports = { getAllSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };