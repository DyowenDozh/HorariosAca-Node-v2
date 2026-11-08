// PrefDetail Controller
const service = require('../services/prefDetail.service');

const getRows = async (req, res) => {
    try {
        const rows = await service.getRows(req.query.schedule_id);
        res.status(200).json({ message: 'Preference details retrieved', data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const saveRows = async (req, res) => {
    try {
        await service.saveRows(req.body.schedule_id, req.body.items);
        res.status(200).json({ message: 'Preference details saved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { getRows, saveRows };
