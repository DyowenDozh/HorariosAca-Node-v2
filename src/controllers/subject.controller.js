// Subject Controller - Handles HTTP requests and responses
const subjectService = require('../services/subject.service');

// GET /api/subjects
const getAllSubjects = async (req, res) => {
    try {
        const subjects = await subjectService.getAllSubjects(req.user.user_id, req.query.schedule_id);
        res.status(200).json({ message: 'Subjects retrieved successfully', total: subjects.length, data: subjects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /api/subjects/:id
const getSubjectById = async (req, res) => {
    try {
        const subject = await subjectService.getSubjectById(req.user.user_id, req.params.id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        res.status(200).json({ message: 'Subject retrieved successfully', data: subject });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /api/subjects
const createSubject = async (req, res) => {
    try {
        const { subject_name, color_id, abbreviation, schedule_id } = req.body;
        if (!subject_name) return res.status(400).json({ message: 'subject_name is required' });
        const newSubject = await subjectService.createSubject(req.user.user_id, subject_name, color_id, abbreviation, schedule_id);
        if (!newSubject) return res.status(403).json({ message: 'Forbidden: schedule does not belong to user' });
        res.status(201).json({ message: 'Subject created successfully', data: newSubject });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /api/subjects/:id
const updateSubject = async (req, res) => {
    try {
        const { subject_name, color_id, abbreviation } = req.body;
        if (!subject_name) return res.status(400).json({ message: 'subject_name is required' });
        const updated = await subjectService.updateSubject(req.user.user_id, req.params.id, subject_name, color_id, abbreviation);
        if (!updated) return res.status(404).json({ message: 'Subject not found' });
        res.status(200).json({ message: 'Subject updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// DELETE /api/subjects/:id
const deleteSubject = async (req, res) => {
    try {
        const deleted = await subjectService.deleteSubject(req.user.user_id, req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Subject not found' });
        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { getAllSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };
