// Subject Routes - API endpoints for subject module
const express = require('express');
const router = express.Router();
const controller = require('../controllers/subject.controller');

// GET /api/subjects
router.get('/', controller.getAllSubjects);

// GET /api/subjects/:id
router.get('/:id', controller.getSubjectById);

// POST /api/subjects
router.post('/', controller.createSubject);

// PUT /api/subjects/:id
router.put('/:id', controller.updateSubject);

// DELETE /api/subjects/:id
router.delete('/:id', controller.deleteSubject);

module.exports = router;