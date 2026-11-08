// GradeSubject Controller
const service = require('../services/gradeSubject.service');

// GET /api/grade-subjects/:gradeId
const getByGrade = async (req, res) => {
    try {
        const rows = await service.getByGrade(req.params.gradeId);
        res.status(200).json({ message: 'Curriculum retrieved', data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /api/grade-subjects/:gradeId  → reemplaza la malla del grado
const replaceForGrade = async (req, res) => {
    try {
        await service.replaceForGrade(req.params.gradeId, req.body.items);
        res.status(200).json({ message: 'Curriculum saved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { getByGrade, replaceForGrade };
