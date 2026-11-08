// Auth Controller - Maneja la solicitud del Http para authentication
const authService = require('../services/authService');
const { isValidEmail, isValidPassword, PASSWORD_MIN } = require('../utils/validators');

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ message: 'nombre, email and password are required' });
        }
        // BUG-003: validar formato del correo en el backend
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'El formato del correo electrónico no es válido' });
        }
        // BUG-004: validar longitud mínima de la contraseña en el backend
        if (!isValidPassword(password)) {
            return res.status(400).json({ message: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres` });
        }

        const newUser = await authService.register(nombre, email, password);
        res.status(201).json({ message: 'User registered successfully', data: newUser });

    } catch (error) {
        if (error.message === 'Email already registered') {
            return res.status(409).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required' });
        }

        const result = await authService.login(email, password);
        res.status(200).json({ message: 'Authentication successful', ...result });

    } catch (error) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const profile = await authService.getProfile(req.user.user_id);
        res.status(200).json({ data: profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /api/auth/me
const updateMe = async (req, res) => {
    try {
        const { nombre, email } = req.body;
        if (!nombre || !email) {
            return res.status(400).json({ message: 'nombre and email are required' });
        }
        // BUG-003: validar formato del correo también al actualizar el perfil
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'El formato del correo electrónico no es válido' });
        }
        const updated = await authService.updateProfile(req.user.user_id, nombre, email);
        res.status(200).json({ message: 'Profile updated', data: updated });
    } catch (error) {
        if (error.message === 'Email already registered') {
            return res.status(409).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /api/auth/password
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'currentPassword and newPassword are required' });
        }
        // BUG-004: validar longitud mínima de la nueva contraseña en el backend
        if (!isValidPassword(newPassword)) {
            return res.status(400).json({ message: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres` });
        }
        await authService.changePassword(req.user.user_id, currentPassword, newPassword);
        res.status(200).json({ message: 'Password updated' });
    } catch (error) {
        if (error.message === 'Current password is incorrect') {
            return res.status(400).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// DELETE /api/auth/me
const deleteMe = async (req, res) => {
    try {
        await authService.deleteAccount(req.user.user_id);
        res.status(200).json({ message: 'Account deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = { register, login, getMe, updateMe, updatePassword, deleteMe };
