require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Kafka Imports
const { producer, consumer, connectKafka } = require('./utils/kafkaClient');

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
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const CLIENT_URLS = process.env.CLIENT_URLS || '';
const allowedOrigins = Array.from(
    new Set(
        [CLIENT_URL, ...CLIENT_URLS.split(',')]
            .map((url) => url.trim())
            .filter(Boolean)
    )
);

// 4. Initialize Socket.io
// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: allowedOrigins.length ? allowedOrigins : CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible to routes via req.app.get('socketio')
app.set('socketio', io);

// Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    socket.on('join', (companyId) => {
        if (companyId && companyId !== "undefined") {
            socket.join(String(companyId));
            console.log(`👤 Socket ${socket.id} joined room: ${companyId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected');
    });
});

// --- KAFKA BRIDGE LOGIC ---
// This bridge listens to Redpanda Cloud and emits to Socket.io
const runKafkaNotificationBridge = async () => {
    try {
        // Redpanda Cloud works best when we explicitly subscribe to an array of topics
        await consumer.subscribe({ 
            topics: ['notifications-topic'], 
            fromBeginning: false 
        });

        console.log('📡 Kafka Consumer Bridge Active: Listening for notifications...');

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const rawData = message.value.toString();
                    const notificationData = JSON.parse(rawData);
                    
                    console.log(`📩 Kafka Message Received for Company: ${notificationData.companyId}`);

                    // Send to the specific company room in Socket.io
                    io.to(String(notificationData.companyId)).emit('newNotification', notificationData);
                } catch (parseError) {
                    console.error('⚠️ Error parsing Kafka message:', parseError.message);
                }
            },
        });
    } catch (error) {
        console.error('❌ Kafka Bridge Error:', error.message);
        // If it fails (usually due to auth/topic issues), retry in 5 seconds
        setTimeout(runKafkaNotificationBridge, 5000);
    }
};

// Middleware & Configuration
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/manpower_ms';

app.set('trust proxy', 1);
app.use(cors({
    origin: allowedOrigins.length ? allowedOrigins : CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json({ limit: '5MB' }));
app.use(express.urlencoded({ limit: '5MB', extended: true }));
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
    res.status(200).json({ status: "OK", message: "Manpower MS API Running with Redpanda Cloud" });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error"
    });
});

// --- START SERVER WITH KAFKA LIFECYCLE ---
const startServer = async () => {
    try {
        // 1. Database Connection
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully.');

        // 2. Connect to Kafka (Producer & Consumer)
        // This function from utils/kafkaClient connects both to the cloud
        await connectKafka();

        // 3. Start the Kafka-to-Socket.io Bridge
        runKafkaNotificationBridge();

        // 4. Start HTTP/Socket Server
        server.listen(PORT, () => {
            console.log(`⚡ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
};

startServer();