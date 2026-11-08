// API Service - Centraliza todas las peticiones HTTP al backend Express
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Instancia de axios con interceptor que adjunta el JWT automáticamente
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/* ============================ AUTH ============================ */
export const loginUser = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
};

export const registerUser = async (nombre, email, password) => {
    const { data } = await api.post('/auth/register', { nombre, email, password });
    return data;
};

export const getProfile = async () => {
    const { data } = await api.get('/auth/me');
    return data;
};

export const updateProfile = async (nombre, email) => {
    const { data } = await api.put('/auth/me', { nombre, email });
    return data;
};

export const changePassword = async (currentPassword, newPassword) => {
    const { data } = await api.put('/auth/password', { currentPassword, newPassword });
    return data;
};

export const deleteAccount = async () => {
    const { data } = await api.delete('/auth/me');
    return data;
};

/* ============================ TEACHERS ============================ */
export const getTeachers = async (scheduleId) => {
    const { data } = await api.get('/teachers', { params: { schedule_id: scheduleId } });
    return data;
};

export const createTeacher = async (teacher_name, amount_hour, schedule_id) => {
    const { data } = await api.post('/teachers', { teacher_name, amount_hour, schedule_id });
    return data;
};

export const updateTeacher = async (id, teacher_name, amount_hour) => {
    const { data } = await api.put(`/teachers/${id}`, { teacher_name, amount_hour });
    return data;
};

export const deleteTeacher = async (id) => {
    const { data } = await api.delete(`/teachers/${id}`);
    return data;
};

/* ============================ SUBJECTS ============================ */
export const getSubjects = async (scheduleId) => {
    const { data } = await api.get('/subjects', { params: { schedule_id: scheduleId } });
    return data;
};

export const createSubject = async (subject_name, color_id, abbreviation, schedule_id) => {
    const { data } = await api.post('/subjects', { subject_name, color_id, abbreviation, schedule_id });
    return data;
};

export const updateSubject = async (id, subject_name, color_id, abbreviation) => {
    const { data } = await api.put(`/subjects/${id}`, { subject_name, color_id, abbreviation });
    return data;
};

export const deleteSubject = async (id) => {
    const { data } = await api.delete(`/subjects/${id}`);
    return data;
};

/* ============================ GRADES ============================ */
export const getGrades = async (scheduleId) => {
    const { data } = await api.get('/grades', { params: { schedule_id: scheduleId } });
    return data;
};

export const createGrade = async (grade_name, schedule_id) => {
    const { data } = await api.post('/grades', { grade_name, schedule_id });
    return data;
};

export const updateGrade = async (id, grade_name) => {
    const { data } = await api.put(`/grades/${id}`, { grade_name });
    return data;
};

export const deleteGrade = async (id) => {
    const { data } = await api.delete(`/grades/${id}`);
    return data;
};

/* ============================ SCHEDULES ============================ */
export const getSchedules = async () => {
    const { data } = await api.get('/schedules');
    return data;
};
export const getScheduleById = async (id) => {
    const { data } = await api.get(`/schedules/${id}`);
    return data;
};
export const createSchedule = async (payload) => {
    const { data } = await api.post('/schedules', payload);
    return data;
};
export const updateSchedule = async (id, payload) => {
    const { data } = await api.put(`/schedules/${id}`, payload);
    return data;
};
export const deleteSchedule = async (id) => {
    const { data } = await api.delete(`/schedules/${id}`);
    return data;
};

export const getScheduleTrash = async () => {
    const { data } = await api.get('/schedules/trash');
    return data;
};

export const restoreSchedule = async (id) => {
    const { data } = await api.put(`/schedules/${id}/restore`);
    return data;
};

export const deleteSchedulePermanent = async (id) => {
    const { data } = await api.delete(`/schedules/${id}/permanent`);
    return data;
};

export const createDraft = async () => {
    const { data } = await api.post('/schedules/draft');
    return data;
};
export const draftHasData = async (id) => {
    const { data } = await api.get(`/schedules/${id}/has-data`);
    return data;
};
export const finalizeSchedule = async (id) => {
    const { data } = await api.put(`/schedules/${id}/finalize`);
    return data;
};

export const getGradeCurriculum = async (gradeId) => {
    const { data } = await api.get(`/grade-subjects/${gradeId}`);
    return data;
};
export const saveGradeCurriculum = async (gradeId, items) => {
    const { data } = await api.put(`/grade-subjects/${gradeId}`, { items });
    return data;
};

export const getTeacherConfig = async (teacherId) => {
    const { data } = await api.get(`/teacher-config/${teacherId}`);
    return data;
};
export const saveTeacherConfig = async (teacherId, payload) => {
    const { data } = await api.put(`/teacher-config/${teacherId}`, payload);
    return data;
};

export const getTeacherContext = async (scheduleId, excludeTeacherId) => {
    const { data } = await api.get('/teacher-config/context', { params: { schedule_id: scheduleId, exclude_teacher_id: excludeTeacherId } });
    return data;
};

export const getPrefDetails = async (scheduleId) => {
    const { data } = await api.get('/pref-details', { params: { schedule_id: scheduleId } });
    return data;
};
export const savePrefDetails = async (scheduleId, items) => {
    const { data } = await api.put('/pref-details', { schedule_id: scheduleId, items });
    return data;
};

export const generateSchedule = async (scheduleId) => {
    const { data } = await api.post(`/generate/${scheduleId}`);
    return data;
};
export const getGeneratedSchedule = async (scheduleId) => {
    const { data } = await api.get(`/generate/${scheduleId}`);
    return data;
};

export default api;
