// Teacher Controller - Handles HTTP requests and responses
const teacherService = require('../services/teacher.service');

// GET /api/teachers
const getAllTeachers = async (req, res) => {
    try {
        const teachers = await teacherService.getAllTeachers(req.user.user_id, req.query.schedule_id);
        res.status(200).json({ message: 'Teachers retrieved successfully', total: teachers.length, data: teachers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /api/teachers/:id
const getTeacherById = async (req, res) => {
    try {
        const teacher = await teacherService.getTeacherById(req.user.user_id, req.params.id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        res.status(200).json({ message: 'Teacher retrieved successfully', data: teacher });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /api/teachers
const createTeacher = async (req, res) => {
    try {
        const { teacher_name, amount_hour, schedule_id } = req.body;
        if (!teacher_name) return res.status(400).json({ message: 'teacher_name is required' });
        const newTeacher = await teacherService.createTeacher(req.user.user_id, teacher_name, amount_hour, schedule_id);
        if (!newTeacher) return res.status(403).json({ message: 'Forbidden: schedule does not belong to user' });
        res.status(201).json({ message: 'Teacher created successfully', data: newTeacher });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /api/teachers/:id
const updateTeacher = async (req, res) => {
    try {
        const { teacher_name, amount_hour } = req.body;
        if (!teacher_name) return res.status(400).json({ message: 'teacher_name is required' });
        const updated = await teacherService.updateTeacher(req.user.user_id, req.params.id, teacher_name, amount_hour);
        if (!updated) return res.status(404).json({ message: 'Teacher not found' });
        res.status(200).json({ message: 'Teacher updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// DELETE /api/teachers/:id
const deleteTeacher = async (req, res) => {
    try {
        const deleted = await teacherService.deleteTeacher(req.user.user_id, req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Teacher not found' });
        res.status(200).json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher };
