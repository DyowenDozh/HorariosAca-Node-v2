// PrefDetail Controller
const service = require('../services/prefDetail.service');

const getRows = async (req, res) => {
    try {
        const rows = await service.getRows(req.query.schedule_id);
        res.status(200).json({ message: 'Preference details retrieved', data: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const saveRows = async (req, res) => {
    try {
        await service.saveRows(req.body.schedule_id, req.body.items);
        res.status(200).json({ message: 'Preference details saved' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getRows, saveRows };
