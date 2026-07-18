// App.js - Express application configuration
const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Import routes
const teacherRoutes = require('./routes/teacher.routes');
const subjectRoutes = require('./routes/subject.routes');
const gradeRoutes = require('./routes/grade.routes');

// Define base routes
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);

// Base route
app.get('/', (req, res) => {
    res.json({ message: 'HorariosAca API REST - Running' });
});

module.exports = app;