// TeacherConfig Routes
const express = require('express');
const router = express.Router();
const controller = require('../controllers/teacherConfig.controller');

router.get('/context', controller.getScheduleContext);
router.get('/:teacherId', controller.getConfig);
router.put('/:teacherId', controller.saveConfig);

module.exports = router;