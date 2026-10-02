const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedDefaultAccounts = require('./utils/seedAtlas');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const parentRoutes = require('./routes/parentRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EduSpark AI backend is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server and handle MongoDB connection gracefully
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas.');
    await seedDefaultAccounts();
  } catch (error) {
    console.warn('⚠️ MongoDB Atlas connection notice:', error.message || error);
    console.warn('⚡ Running in resilient fallback / offline demo mode using memoryStore.');
    console.warn('👉 To connect MongoDB Atlas: Whitelist your IP in Atlas Network Access (0.0.0.0/0 for dev).');
  }

  app.listen(PORT, () => {
    console.log(`🚀 EduSpark AI Backend Server running on http://localhost:${PORT}`);
  });
};

startServer();
