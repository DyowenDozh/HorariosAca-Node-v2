// Teacher Routes - API endpoints for teacher module
const express = require('express');
const router = express.Router();
const controller = require('../controllers/teacher.controller');

// GET /api/teachers
router.get('/', controller.getAllTeachers);

// GET /api/teachers/:id
router.get('/:id', controller.getTeacherById);

// POST /api/teachers
router.post('/', controller.createTeacher);

// PUT /api/teachers/:id
router.put('/:id', controller.updateTeacher);

// DELETE /api/teachers/:id
router.delete('/:id', controller.deleteTeacher);

module.exports = router;