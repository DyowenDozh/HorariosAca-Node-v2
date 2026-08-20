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

// Obtener perfil del usuario autenticado
const getProfile = async (userId) => {
    const [rows] = await pool.query(
        'SELECT user_id, nombre, email, created_at FROM users WHERE user_id = ?',
        [userId]
    );
    if (rows.length === 0) throw new Error('User not found');
    return rows[0];
};

// Actualizar nombre y email
const updateProfile = async (userId, nombre, email) => {
    // Verificar que el email no esté usado por otro usuario
    const [existing] = await pool.query(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
        [email, userId]
    );
    if (existing.length > 0) throw new Error('Email already registered');

    await pool.query(
        'UPDATE users SET nombre = ?, email = ? WHERE user_id = ?',
        [nombre, email, userId]
    );
    return { user_id: userId, nombre, email };
};

// Cambiar contraseña (verifica la actual antes de cambiar)
const changePassword = async (userId, currentPassword, newPassword) => {
    const [rows] = await pool.query('SELECT password FROM users WHERE user_id = ?', [userId]);
    if (rows.length === 0) throw new Error('User not found');

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) throw new Error('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, userId]);
    return { message: 'Password updated' };
};

// Eliminar cuenta
const deleteAccount = async (userId) => {
    await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
    return { message: 'Account deleted' };
};

module.exports = { register, login, getProfile, updateProfile, changePassword, deleteAccount };