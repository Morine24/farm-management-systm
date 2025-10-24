const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
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
app.use('/api/fields', require('./routes/fields'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/financial', require('./routes/financial'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/labour', require('./routes/labour'));

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});