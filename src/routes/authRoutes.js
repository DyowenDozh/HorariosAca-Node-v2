// Auth Routes - API endpoints for authentication
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas (requieren token JWT)
router.get('/me', verifyToken, authController.getMe);
router.put('/me', verifyToken, authController.updateMe);
router.put('/password', verifyToken, authController.updatePassword);
router.delete('/me', verifyToken, authController.deleteMe);

module.exports = router;