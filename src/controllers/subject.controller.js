// Subject Controller - Handles HTTP requests and responses
const subjectService = require('../services/subject.service');

// GET /api/subjects
const getAllSubjects = async (req, res) => {
    try {
        const subjects = await subjectService.getAllSubjects();
        res.status(200).json({
            message: 'Subjects retrieved successfully',
            total: subjects.length,
            data: subjects
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET de la direccion /api/subjects/:id
const getSubjectById = async (req, res) => {
    try {
        const subject = await subjectService.getSubjectById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Subject retrieved successfully', data: subject });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST de la direccion  /api/subjects
const createSubject = async (req, res) => {
    try {
        const { subject_name, color_id } = req.body;
        if (!subject_name) {
            return res.status(400).json({ message: 'subject_name is required' });
        }
        const newSubject = await subjectService.createSubject(subject_name, color_id);
        res.status(201).json({ message: 'Subject created successfully', data: newSubject });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT de la direccion  /api/subjects/:id
const updateSubject = async (req, res) => {
    try {
        const { subject_name, color_id } = req.body;
        if (!subject_name) {
            return res.status(400).json({ message: 'subject_name is required' });
        }
        const updated = await subjectService.updateSubject(req.params.id, subject_name, color_id);
        if (!updated) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Subject updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE de la direccion  /api/subjects/:id
const deleteSubject = async (req, res) => {
    try {
        const deleted = await subjectService.deleteSubject(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };