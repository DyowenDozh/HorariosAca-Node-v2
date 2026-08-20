// TeacherConfig Controller
const service = require('../services/teacherConfig.service');

const getConfig = async (req, res) => {
    try {
        const data = await service.getConfig(req.params.teacherId);
        res.status(200).json({ message: 'Config retrieved', data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const saveConfig = async (req, res) => {
    try {
        await service.saveConfig(req.params.teacherId, req.body);
        res.status(200).json({ message: 'Config saved' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getScheduleContext = async (req, res) => {
    try {
        const data = await service.getScheduleContext(req.query.schedule_id, req.query.exclude_teacher_id);
        res.status(200).json({ message: 'Context retrieved', data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getConfig, saveConfig, getScheduleContext };