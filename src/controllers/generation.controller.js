// Generation Controller
const service = require('../services/generation.service');
const authService = require('../services/authService');

// Generar y editar el horario son funciones del plan Premium (RF-05, RF-06).
async function ensurePremium(req, res) {
    const premium = await authService.isPremium(req.user.user_id);
    if (!premium) {
        res.status(403).json({ message: 'Esta función requiere el plan Premium.', premiumRequired: true });
        return false;
    }
    return true;
}

// POST /api/generate/:scheduleId  → genera y guarda el horario
const generate = async (req, res) => {
    try {
        if (!(await ensurePremium(req, res))) return;
        const result = await service.generate(req.user.user_id, req.params.scheduleId);
        if (!result.ok) return res.status(409).json({ message: result.reason, ok: false });
        res.status(200).json({ message: 'Horario generado', ok: true, ...result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /api/generate/:scheduleId  → devuelve el horario generado
const getGenerated = async (req, res) => {
    try {
        const rows = await service.getGenerated(req.user.user_id, req.params.scheduleId);
        if (rows === null) return res.status(404).json({ message: 'Horario no encontrado' });
        res.status(200).json({ message: 'Horario generado recuperado', data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /api/generate/:scheduleId/editor  → contexto completo para el editor manual
const getEditorContext = async (req, res) => {
    try {
        const data = await service.getEditorContext(req.user.user_id, req.params.scheduleId);
        if (data === null) return res.status(404).json({ message: 'Horario no encontrado' });
        res.status(200).json({ message: 'Contexto del editor', data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /api/generate/:scheduleId/manual  → guarda el horario editado a mano
const saveManual = async (req, res) => {
    try {
        if (!(await ensurePremium(req, res))) return;
        const result = await service.saveManual(req.user.user_id, req.params.scheduleId, req.body.placements);
        if (!result.ok) return res.status(409).json({ message: result.reason, ok: false });
        res.status(200).json({ message: 'Horario guardado', ok: true, ...result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { generate, getGenerated, getEditorContext, saveManual };