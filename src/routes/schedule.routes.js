// Schedule Routes - Endpoints del módulo de horarios
const express = require('express');
const router = express.Router();
const controller = require('../controllers/schedule.controller');

// Rutas específicas ANTES de /:id para no confundirlas con un id
router.get('/trash', controller.getTrash);
router.post('/draft', controller.createDraftHandler);

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.get('/:id/has-data', controller.draftHasDataHandler);
router.post('/', controller.create);
router.put('/:id/finalize', controller.finalizeHandler);
router.put('/:id/restore', controller.restore);
router.put('/:id', controller.update);
router.delete('/:id/permanent', controller.removePermanent);
router.delete('/:id', controller.remove);

module.exports = router;