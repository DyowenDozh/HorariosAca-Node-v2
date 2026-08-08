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

module.exports = { register, login };