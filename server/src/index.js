require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http'); // 1. Import HTTP module
const { Server } = require('socket.io'); // 2. Import Socket.io

// Route Imports
const authRoutes = require('./routes/auth');
const employerRoutes = require('./routes/employerRoutes');
const jobDemandRoutes = require('./routes/jobDemandRoutes');
const workerRoutes = require('./routes/workerRoutes');
const subAgentRoutes = require('./routes/subAgentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const supportRoutes = require('./routes/supportRoutes');

const app = express();
const server = http.createServer(app); // 3. Create HTTP server from express app

// 4. Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// 5. Make 'io' accessible in your controllers
app.set('socketio', io);

// Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', (companyId) => {
        if (companyId) {
            socket.join(String(companyId));
            console.log(`Socket ${socket.id} joined room: ${companyId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/manpower_ms';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
app.set('trust proxy', 1);

app.use(cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json({ limit: '5MB' }));
app.use(express.urlencoded({ limit: '5MB', extended: true }));
// Serve uploads from project root (works for both src and dist builds)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/job-demands', jobDemandRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/sub-agents', subAgentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ status: "OK", message: "Manpower MS API Running" });
});

app.use((err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error"
    });
});

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully.');
        
        // 6. CRITICAL: Listen on 'server', NOT 'app'
        server.listen(PORT, () => {
            console.log(`⚡ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
};

startServer();