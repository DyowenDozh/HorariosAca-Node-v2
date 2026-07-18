// index.js - Server entry point
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  GET    http://localhost:${PORT}/api/teachers`);
    console.log(`  GET    http://localhost:${PORT}/api/subjects`);
    console.log(`  GET    http://localhost:${PORT}/api/grades`);
});