// Auth Controller - Maneja la solicitud del Http para authentication
const authService = require('../services/authService');

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ message: 'nombre, email and password are required' });
        }

        const newUser = await authService.register(nombre, email, password);
        res.status(201).json({ message: 'User registered successfully', data: newUser });

    } catch (error) {
        if (error.message === 'Email already registered') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
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
        res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const profile = await authService.getProfile(req.user.user_id);
        res.status(200).json({ data: profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/auth/me
const updateMe = async (req, res) => {
    try {
        const { nombre, email } = req.body;
        if (!nombre || !email) {
            return res.status(400).json({ message: 'nombre and email are required' });
        }
        const updated = await authService.updateProfile(req.user.user_id, nombre, email);
        res.status(200).json({ message: 'Profile updated', data: updated });
    } catch (error) {
        if (error.message === 'Email already registered') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/auth/password
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'currentPassword and newPassword are required' });
        }
        await authService.changePassword(req.user.user_id, currentPassword, newPassword);
        res.status(200).json({ message: 'Password updated' });
    } catch (error) {
        if (error.message === 'Current password is incorrect') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/auth/me
const deleteMe = async (req, res) => {
    try {
        await authService.deleteAccount(req.user.user_id);
        res.status(200).json({ message: 'Account deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, login, getMe, updateMe, updatePassword, deleteMe };