// Schedule Service - Lógica de negocio para horarios (tablas normalizadas)
const pool = require('../config/db');

// Lista los horarios de Gestión: finalizados + borradores que YA tienen datos
// (los borradores vacíos no se muestran).
const getSchedulesByUser = async (userId) => {
    const [rows] = await pool.query(
        `SELECT s.schedule_id, s.name, s.institution, s.school_year, s.journey, s.day_mode, s.is_draft, s.created_at
         FROM schedules s
         WHERE s.user_id = ? AND s.deleted_at IS NULL
           AND (
             s.is_draft = 0
             OR EXISTS (SELECT 1 FROM subjects sub WHERE sub.schedule_id = s.schedule_id)
             OR EXISTS (SELECT 1 FROM teachers te WHERE te.schedule_id = s.schedule_id)
             OR EXISTS (SELECT 1 FROM grades gr WHERE gr.schedule_id = s.schedule_id)
           )
         ORDER BY s.created_at DESC`,
        [userId]
    );
    return rows;
};

// Crea un borrador vacío y devuelve su id
const createDraft = async (userId) => {
    const [res] = await pool.query(
        "INSERT INTO schedules (user_id, name, is_draft) VALUES (?, '', 1)",
        [userId]
    );
    return { schedule_id: res.insertId };
};

// ¿El borrador tiene datos (materias, profesores o grados)?
const draftHasData = async (userId, id) => {
    const [own] = await pool.query('SELECT schedule_id FROM schedules WHERE schedule_id = ? AND user_id = ?', [id, userId]);
    if (own.length === 0) return false;
    const [[{ c1 }]] = await pool.query('SELECT COUNT(*) AS c1 FROM subjects WHERE schedule_id = ?', [id]);
    const [[{ c2 }]] = await pool.query('SELECT COUNT(*) AS c2 FROM teachers WHERE schedule_id = ?', [id]);
    const [[{ c3 }]] = await pool.query('SELECT COUNT(*) AS c3 FROM grades WHERE schedule_id = ?', [id]);
    return (c1 + c2 + c3) > 0;
};

// Marca un borrador como finalizado (is_draft = 0)
const finalizeDraft = async (userId, id) => {
    const [res] = await pool.query(
        'UPDATE schedules SET is_draft = 0 WHERE schedule_id = ? AND user_id = ?',
        [id, userId]
    );
    return res.affectedRows > 0;
};

// Lista los horarios en la PAPELERA de un usuario
const getTrashByUser = async (userId) => {
    const [rows] = await pool.query(
        'SELECT schedule_id, name, institution, school_year, journey, day_mode, created_at, deleted_at ' +
        'FROM schedules WHERE user_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC',
        [userId]
    );
    return rows;
};

// Obtiene un horario completo (con días, descansos y preferencias)
const getScheduleById = async (userId, id) => {
    const [schedRows] = await pool.query(
        'SELECT * FROM schedules WHERE schedule_id = ? AND user_id = ?',
        [id, userId]
    );
    if (schedRows.length === 0) return null;
    const schedule = schedRows[0];

    const [days] = await pool.query('SELECT * FROM schedule_days WHERE schedule_id = ?', [id]);
    for (const d of days) {
        const [breaks] = await pool.query(
            'SELECT break_id, after_hour, minutes FROM schedule_breaks WHERE day_id = ?',
            [d.day_id]
        );
        d.breaks = breaks;
    }
    const [prefsRows] = await pool.query('SELECT * FROM schedule_prefs WHERE schedule_id = ?', [id]);

    return { ...schedule, days, prefs: prefsRows[0] || null };
};

// Inserta los días, descansos y preferencias (usado por create y update)
const insertChildren = async (conn, scheduleId, payload) => {
    const { days = {}, workDays = {}, prefs = {} } = payload;

    // days es un objeto { all:{...}, lun:{...}, ... }
    for (const [dayKey, cfg] of Object.entries(days)) {
        const isWorking = dayKey === 'all' ? 1 : (workDays[dayKey] ? 1 : 0);
        const [res] = await conn.query(
            'INSERT INTO schedule_days (schedule_id, day_key, is_working, hours_per_day, class_h, class_m, start_h, start_m, start_ap) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [scheduleId, dayKey, isWorking, cfg.hoursPerDay ?? 1, cfg.classH ?? 1, cfg.classM ?? 0,
             cfg.startH ?? 6, cfg.startM ?? 0, cfg.startAP ?? 'AM']
        );
        const dayId = res.insertId;
        for (const b of (cfg.breaks || [])) {
            await conn.query(
                'INSERT INTO schedule_breaks (day_id, after_hour, minutes) VALUES (?, ?, ?)',
                [dayId, b.afterHour, b.minutes]
            );
        }
    }

    await conn.query(
        'INSERT INTO schedule_prefs (schedule_id, no_repeat_same_day, group_two_hours, avoid_three_in_row, area_meeting, avoid_no_break) ' +
        'VALUES (?, ?, ?, ?, ?, ?)',
        [scheduleId, prefs.noRepeatSameDay ? 1 : 0, prefs.groupTwoHours ? 1 : 0,
         prefs.avoidThreeInRow ? 1 : 0, prefs.areaMeeting ? 1 : 0, prefs.avoidNoBreak ? 1 : 0]
    );
};

// Crea un horario completo dentro de una transacción
const createSchedule = async (userId, payload) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const g = payload.general || {};
        const [res] = await conn.query(
            'INSERT INTO schedules (user_id, name, institution, school_year, journey, day_mode) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, payload.name || 'Horario sin nombre', g.institution || '', g.schoolYear || '',
             g.journey || 'mañana', payload.dayMode || 'uniform']
        );
        const scheduleId = res.insertId;
        await insertChildren(conn, scheduleId, payload);
        await conn.commit();
        return { schedule_id: scheduleId };
    } catch (error) {
        await conn.rollback();
        throw new Error('Error creating schedule: ' + error.message);
    } finally {
        conn.release();
    }
};

// Actualiza un horario: reemplaza sus hijos (días/descansos/prefs) por los nuevos
const updateSchedule = async (userId, id, payload) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        // Verifica pertenencia
        const [own] = await conn.query('SELECT schedule_id FROM schedules WHERE schedule_id = ? AND user_id = ?', [id, userId]);
        if (own.length === 0) { await conn.rollback(); return false; }

        const g = payload.general || {};
        await conn.query(
            'UPDATE schedules SET name = ?, institution = ?, school_year = ?, journey = ?, day_mode = ? WHERE schedule_id = ?',
            [payload.name || 'Horario sin nombre', g.institution || '', g.schoolYear || '',
             g.journey || 'mañana', payload.dayMode || 'uniform', id]
        );
        // Borra hijos (los descansos caen por ON DELETE CASCADE al borrar días)
        await conn.query('DELETE FROM schedule_days WHERE schedule_id = ?', [id]);
        await conn.query('DELETE FROM schedule_prefs WHERE schedule_id = ?', [id]);
        await insertChildren(conn, id, payload);

        await conn.commit();
        return true;
    } catch (error) {
        await conn.rollback();
        throw new Error('Error updating schedule: ' + error.message);
    } finally {
        conn.release();
    }
};

// Enviar a la papelera (soft delete): marca deleted_at
const softDeleteSchedule = async (userId, id) => {
    const [res] = await pool.query(
        'UPDATE schedules SET deleted_at = NOW() WHERE schedule_id = ? AND user_id = ? AND deleted_at IS NULL',
        [id, userId]
    );
    return res.affectedRows > 0;
};

// Restaurar desde la papelera: limpia deleted_at
const restoreSchedule = async (userId, id) => {
    const [res] = await pool.query(
        'UPDATE schedules SET deleted_at = NULL WHERE schedule_id = ? AND user_id = ? AND deleted_at IS NOT NULL',
        [id, userId]
    );
    return res.affectedRows > 0;
};

// Eliminar definitivamente (los hijos caen por ON DELETE CASCADE)
const hardDeleteSchedule = async (userId, id) => {
    const [res] = await pool.query(
        'DELETE FROM schedules WHERE schedule_id = ? AND user_id = ?',
        [id, userId]
    );
    return res.affectedRows > 0;
};

module.exports = {
    getSchedulesByUser, getTrashByUser, getScheduleById, createSchedule,
    updateSchedule, softDeleteSchedule, restoreSchedule, hardDeleteSchedule,
    createDraft, draftHasData, finalizeDraft
};