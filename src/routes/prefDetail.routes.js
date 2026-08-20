// PrefDetail Routes
const express = require('express');
const router = express.Router();
const controller = require('../controllers/prefDetail.controller');

router.get('/', controller.getRows);
router.put('/', controller.saveRows);

module.exports = router;
