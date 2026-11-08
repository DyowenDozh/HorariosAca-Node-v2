// Grade Controller - Handles HTTP requests and responses
const gradeService = require('../services/grade.service');

// GET /api/grades
const getAllGrades = async (req, res) => {
    try {
        const grades = await gradeService.getAllGrades(req.user.user_id, req.query.schedule_id);
        res.status(200).json({ message: 'Grades retrieved successfully', total: grades.length, data: grades });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /api/grades/:id
const getGradeById = async (req, res) => {
    try {
        const grade = await gradeService.getGradeById(req.user.user_id, req.params.id);
        if (!grade) return res.status(404).json({ message: 'Grade not found' });
        res.status(200).json({ message: 'Grade retrieved successfully', data: grade });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /api/grades
const createGrade = async (req, res) => {
    try {
        const { grade_name, schedule_id } = req.body;
        if (!grade_name) return res.status(400).json({ message: 'grade_name is required' });
        const newGrade = await gradeService.createGrade(req.user.user_id, grade_name, schedule_id);
        if (!newGrade) return res.status(403).json({ message: 'Forbidden: schedule does not belong to user' });
        res.status(201).json({ message: 'Grade created successfully', data: newGrade });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /api/grades/:id
const updateGrade = async (req, res) => {
    try {
        const { grade_name } = req.body;
        if (!grade_name) return res.status(400).json({ message: 'grade_name is required' });
        const updated = await gradeService.updateGrade(req.user.user_id, req.params.id, grade_name);
        if (!updated) return res.status(404).json({ message: 'Grade not found' });
        res.status(200).json({ message: 'Grade updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// DELETE /api/grades/:id
const deleteGrade = async (req, res) => {
    try {
        const deleted = await gradeService.deleteGrade(req.user.user_id, req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Grade not found' });
        res.status(200).json({ message: 'Grade deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { getAllGrades, getGradeById, createGrade, updateGrade, deleteGrade };
