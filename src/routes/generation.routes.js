// Generation Routes
const express = require('express');
const router = express.Router();
const controller = require('../controllers/generation.controller');

router.post('/:scheduleId', controller.generate);
router.get('/:scheduleId', controller.getGenerated);

module.exports = router;
