// Grade Controller - Handles HTTP requests and responses
const gradeService = require('../services/grade.service');

// GET /api/grades
const getAllGrades = async (req, res) => {
    try {
        const grades = await gradeService.getAllGrades();
        res.status(200).json({
            message: 'Grades retrieved successfully',
            total: grades.length,
            data: grades
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET de la direccion  /api/grades/:id
const getGradeById = async (req, res) => {
    try {
        const grade = await gradeService.getGradeById(req.params.id);
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }
        res.status(200).json({ message: 'Grade retrieved successfully', data: grade });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST de la direccion /api/grades
const createGrade = async (req, res) => {
    try {
        const { grade_name } = req.body;
        if (!grade_name) {
            return res.status(400).json({ message: 'grade_name is required' });
        }
        const newGrade = await gradeService.createGrade(grade_name);
        res.status(201).json({ message: 'Grade created successfully', data: newGrade });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT  de la direccion /api/grades/:id
const updateGrade = async (req, res) => {
    try {
        const { grade_name } = req.body;
        if (!grade_name) {
            return res.status(400).json({ message: 'grade_name is required' });
        }
        const updated = await gradeService.updateGrade(req.params.id, grade_name);
        if (!updated) {
            return res.status(404).json({ message: 'Grade not found' });
        }
        res.status(200).json({ message: 'Grade updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE de la direccion /api/grades/:id
const deleteGrade = async (req, res) => {
    try {
        const deleted = await gradeService.deleteGrade(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Grade not found' });
        }
        res.status(200).json({ message: 'Grade deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllGrades, getGradeById, createGrade, updateGrade, deleteGrade };