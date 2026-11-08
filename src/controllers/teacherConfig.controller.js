// TeacherConfig Controller
const service = require('../services/teacherConfig.service');

const getConfig = async (req, res) => {
    try {
        const data = await service.getConfig(req.user.user_id, req.params.teacherId);
        if (!data) return res.status(404).json({ message: 'Teacher not found' });
        res.status(200).json({ message: 'Config retrieved', data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const saveConfig = async (req, res) => {
    try {
        const ok = await service.saveConfig(req.user.user_id, req.params.teacherId, req.body);
        if (!ok) return res.status(404).json({ message: 'Teacher not found' });
        res.status(200).json({ message: 'Config saved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const getScheduleContext = async (req, res) => {
    try {
        const data = await service.getScheduleContext(req.user.user_id, req.query.schedule_id, req.query.exclude_teacher_id);
        if (!data) return res.status(403).json({ message: 'Forbidden: schedule does not belong to user' });
        res.status(200).json({ message: 'Context retrieved', data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { getConfig, saveConfig, getScheduleContext };
