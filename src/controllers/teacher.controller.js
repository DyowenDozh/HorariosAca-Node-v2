// Teacher Controller - Handles HTTP requests and responses
const teacherService = require('../services/teacher.service');

// GET /api/teachers
const getAllTeachers = async (req, res) => {
    try {
        const teachers = await teacherService.getAllTeachers();
        res.status(200).json({
            message: 'Teachers retrieved successfully',
            total: teachers.length,
            data: teachers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/teachers/:id
const getTeacherById = async (req, res) => {
    try {
        const teacher = await teacherService.getTeacherById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.status(200).json({ message: 'Teacher retrieved successfully', data: teacher });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/teachers
const createTeacher = async (req, res) => {
    try {
        const { teacher_name, amount_hour } = req.body;
        if (!teacher_name) {
            return res.status(400).json({ message: 'teacher_name is required' });
        }
        const newTeacher = await teacherService.createTeacher(teacher_name, amount_hour);
        res.status(201).json({ message: 'Teacher created successfully', data: newTeacher });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/teachers/:id
const updateTeacher = async (req, res) => {
    try {
        const { teacher_name, amount_hour } = req.body;
        if (!teacher_name) {
            return res.status(400).json({ message: 'teacher_name is required' });
        }
        const updated = await teacherService.updateTeacher(req.params.id, teacher_name, amount_hour);
        if (!updated) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.status(200).json({ message: 'Teacher updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/teachers/:id
const deleteTeacher = async (req, res) => {
    try {
        const deleted = await teacherService.deleteTeacher(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.status(200).json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher };