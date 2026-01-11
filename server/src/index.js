// D:\manpower-ms\server\src\index.js
require('dotenv').config(); // ✅ FIXED: Load variables before everything else

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Route Imports
const authRoutes = require('./routes/auth');
const employerRoutes = require('./routes/employerRoutes');
const jobDemandRoutes = require('./routes/jobDemandRoutes');
const workerRoutes = require('./routes/workerRoutes');
const subAgentRoutes = require('./routes/subAgentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/manpower_ms';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
    origin: CLIENT_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/job-demands', jobDemandRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/sub-agents', subAgentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health Check
app.get('/', (req, res) => {
    res.status(200).json({ status: "OK", message: "Manpower MS API Running" });
});

// Database & Server Start
const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully.');
        app.listen(PORT, () => {
            console.log(`⚡ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
};

startServer();