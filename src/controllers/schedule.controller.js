// Schedule Controller - Maneja las peticiones HTTP del módulo de horarios
const scheduleService = require('../services/schedule.service');

// GET /api/schedules
const getAll = async (req, res) => {
    try {
        const list = await scheduleService.getSchedulesByUser(req.user.user_id);
        res.status(200).json({ message: 'Schedules retrieved', total: list.length, data: list });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /api/schedules/:id
const getOne = async (req, res) => {
    try {
        const schedule = await scheduleService.getScheduleById(req.user.user_id, req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.status(200).json({ message: 'Schedule retrieved', data: schedule });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /api/schedules
const create = async (req, res) => {
    try {
        if (!req.body.name) return res.status(400).json({ message: 'name is required' });
        const result = await scheduleService.createSchedule(req.user.user_id, req.body);
        res.status(201).json({ message: 'Schedule created', data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /api/schedules/:id
const update = async (req, res) => {
    try {
        const ok = await scheduleService.updateSchedule(req.user.user_id, req.params.id, req.body);
        if (!ok) return res.status(404).json({ message: 'Schedule not found' });
        res.status(200).json({ message: 'Schedule updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /api/schedules/trash
const getTrash = async (req, res) => {
    try {
        const list = await scheduleService.getTrashByUser(req.user.user_id);
        res.status(200).json({ message: 'Trash retrieved', total: list.length, data: list });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// DELETE /api/schedules/:id  → envía a la papelera (soft delete)
const remove = async (req, res) => {
    try {
        const ok = await scheduleService.softDeleteSchedule(req.user.user_id, req.params.id);
        if (!ok) return res.status(404).json({ message: 'Schedule not found' });
        res.status(200).json({ message: 'Schedule moved to trash' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /api/schedules/:id/restore  → restaura desde la papelera
const restore = async (req, res) => {
    try {
        const ok = await scheduleService.restoreSchedule(req.user.user_id, req.params.id);
        if (!ok) return res.status(404).json({ message: 'Schedule not found in trash' });
        res.status(200).json({ message: 'Schedule restored' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// DELETE /api/schedules/:id/permanent  → elimina definitivamente
const removePermanent = async (req, res) => {
    try {
        const ok = await scheduleService.hardDeleteSchedule(req.user.user_id, req.params.id);
        if (!ok) return res.status(404).json({ message: 'Schedule not found' });
        res.status(200).json({ message: 'Schedule permanently deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /api/schedules/draft  → crea un borrador vacío y devuelve su id
const createDraftHandler = async (req, res) => {
    try {
        const result = await scheduleService.createDraft(req.user.user_id);
        res.status(201).json({ message: 'Draft created', data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /api/schedules/:id/has-data  → ¿el borrador tiene datos?
const draftHasDataHandler = async (req, res) => {
    try {
        const hasData = await scheduleService.draftHasData(req.user.user_id, req.params.id);
        res.status(200).json({ hasData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /api/schedules/:id/finalize  → marca el borrador como finalizado
const finalizeHandler = async (req, res) => {
    try {
        const ok = await scheduleService.finalizeDraft(req.user.user_id, req.params.id);
        if (!ok) return res.status(404).json({ message: 'Schedule not found' });
        res.status(200).json({ message: 'Schedule finalized' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /api/schedules/:id/duplicate  → duplica el horario completo a uno nuevo
const duplicateHandler = async (req, res) => {
    try {
        const result = await scheduleService.duplicateSchedule(req.user.user_id, req.params.id, req.body.name);
        if (!result) return res.status(404).json({ message: 'Schedule not found' });
        res.status(201).json({ message: 'Schedule duplicated', data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { getAll, getTrash, getOne, create, update, remove, restore, removePermanent, createDraftHandler, draftHasDataHandler, finalizeHandler, duplicateHandler };