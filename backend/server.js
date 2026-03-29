const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
app.use(express.json());

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express.static(uploadsDir));

// DB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/game_web';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Duel Manager
const DuelManager = require('./duelManager');
const duelManager = new DuelManager(io);

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join_queue', (user) => {
    duelManager.addToQueue(socket, user);
  });

  socket.on('leave_queue', () => {
    duelManager.removeFromQueue(socket.id);
  });

  socket.on('pvp_action', (data) => {
    // data: { roomID, action }
    duelManager.handleAction(data.roomID, socket.id, data.action);
  });

  socket.on('pvp_end', (data) => {
    // data: { roomID, winnerName }
    duelManager.endDuel(data.roomID, data.winnerName);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    duelManager.removeFromQueue(socket.id);
  });
});

// Routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const storyRoutes = require('./routes/story');
const configRoutes = require('./routes/config');
const duelRoutes = require('./routes/duels');
const missionRoutes = require('./routes/missions');
const rankingRoutes = require('./routes/ranking');
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/config', configRoutes);
app.use('/api/duels', duelRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/ranking', rankingRoutes);

app.get('/', (req, res) => {
  res.send('Game_Web API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Error de subida: ${err.message}` });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
