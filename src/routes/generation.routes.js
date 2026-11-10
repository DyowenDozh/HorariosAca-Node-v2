// Generation Routes
const express = require('express');
const router = express.Router();
const controller = require('../controllers/generation.controller');

router.post('/:scheduleId', controller.generate);
router.get('/:scheduleId/editor', controller.getEditorContext);
router.put('/:scheduleId/manual', controller.saveManual);
router.get('/:scheduleId', controller.getGenerated);

module.exports = router;
