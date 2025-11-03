const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());

// Initialize Firebase
let db;
try {
  const { db: firebaseDb } = require('./config/firebase');
  db = firebaseDb;
  app.set('db', db);
  console.log('✅ Firebase connected successfully');
} catch (error) {
  console.error('❌ Firebase connection failed:', error.message);
  console.log('⚠️  Running without database connection');
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/farms', require('./routes/farms'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/blocks', require('./routes/blocks'));
app.use('/api/beds', require('./routes/beds'));
app.use('/api/driplines', require('./routes/driplines'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/financial', require('./routes/financial'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/labour', require('./routes/labour'));
app.use('/api/notifications', require('./routes/notifications'));

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_farm', (farmId) => {
    socket.join(farmId);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../farm-management-frontend/build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../farm-management-frontend/build/index.html'));
  }
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});