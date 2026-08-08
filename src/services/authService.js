// Auth Service - Logica negocio de  authentication
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register user
const register = async (nombre, email, password) => {
    try {
        // Check if email already exists
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            throw new Error('Email already registered');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user to database
        const [result] = await pool.query(
            'INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, hashedPassword]
        );

        return { user_id: result.insertId, nombre, email };
    } catch (error) {
        throw error;
    }
};

// Login user
const login = async (email, password) => {
    try {
        // Find user con email
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            throw new Error('Invalid credentials');
        }

        const user = rows[0];

        // Compare password with hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Generar JWT token
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, nombre: user.nombre },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return {
            token,
            user: { id: user.user_id, nombre: user.nombre, email: user.email }
        };
    } catch (error) {
        throw error;
    }
};

module.exports = { register, login };