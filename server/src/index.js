// D:\manpower-ms\server\src\index.js (CORRECTED FUNCTION ORDER)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth'); // NEW: Import Routes
const employerRoutes = require('./routes/employerRoutes');
const jobDemandRoutes = require('./routes/jobDemandRoutes');
const workerRoutes = require('./routes/workerRoutes');
const subAgentRoutes = require('./routes/subAgentRoutes'); // NEW: SubAgent Routes
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); // NEW: Dashboard Routes


// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/manpower_ms';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';


// Middleware Setup
// ----------------------------------------------------
app.use(cors({
    origin: CLIENT_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.use(express.json());

// Application Routes (Middleware)
// ----------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/employers', employerRoutes);

// ... other middleware
app.use('/api/job-demands', jobDemandRoutes);
app.use('/api/workers', workerRoutes);
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/sub-agents', subAgentRoutes); // NEW: SubAgent Routes
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes); // NEW: Dashboard Routes

// Database Connection (MOVED UP)
// ----------------------------------------------------
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully.');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};


// Start Server Function (REMAINS HERE)
// ----------------------------------------------------
const startServer = async () => {
    // 1. Connect to the database
    await connectDB(); // Now connectDB is defined!

    // 2. Start the Express server
    app.listen(PORT, () => {
        console.log(`⚡ Server is running on http://localhost:${PORT}`);
    });
};


// Application Routes (Initial Setup - Keep this for testing)
// ----------------------------------------------------
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Manpower MS API Running Scalably!",
        status: "OK",
        service: "Node.js/Express/MongoDB",
    });
});


// Execute the server start-up
startServer();