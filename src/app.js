// App.js - Express application configuration
const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Import auth middleware
const verifyToken = require('./middlewares/authMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacher.routes');
const subjectRoutes = require('./routes/subject.routes');
const gradeRoutes = require('./routes/grade.routes');

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes - requiere valid JWT token
app.use('/api/teachers', verifyToken, teacherRoutes);
app.use('/api/subjects', verifyToken, subjectRoutes);
app.use('/api/grades', verifyToken, gradeRoutes);

// Base route
app.get('/', (req, res) => {
    res.json({ message: 'HorariosAca API REST - Running' });
});

module.exports = app;