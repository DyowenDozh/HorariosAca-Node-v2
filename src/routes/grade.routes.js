// Grade Routes - API endpoints for grade module
const express = require('express');
const router = express.Router();
const controller = require('../controllers/grade.controller');

// GET /api/grades
router.get('/', controller.getAllGrades);

// GET /api/grades/:id
router.get('/:id', controller.getGradeById);

// POST /api/grades
router.post('/', controller.createGrade);

// PUT /api/grades/:id
router.put('/:id', controller.updateGrade);

// DELETE /api/grades/:id
router.delete('/:id', controller.deleteGrade);

module.exports = router;