// GradeSubject Routes
const express = require('express');
const router = express.Router();
const controller = require('../controllers/gradeSubject.controller');

router.get('/:gradeId', controller.getByGrade);
router.put('/:gradeId', controller.replaceForGrade);

module.exports = router;
