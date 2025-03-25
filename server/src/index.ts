import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { GameManager } from './game/gameManager';

// Socket.IO event types (copied from shared/constants.ts)
enum SOCKET_EVENTS {
  PLAYER_JOIN = 'player:join',
  PLAYER_LEAVE = 'player:leave',
  PLAYER_MOVE = 'player:move',
  PLAYER_SHOOT = 'player:shoot',
  PLAYER_HIT = 'player:hit',
  PLAYER_DIE = 'player:die',
  PLAYER_RESPAWN = 'player:respawn',
  GAME_START = 'game:start',
  GAME_END = 'game:end',
  GAME_UPDATE = 'game:update',
  CHAT_MESSAGE = 'chat:message',
}

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Additional configuration for debugging
  pingTimeout: 60000, // Increase ping timeout to 60 seconds
  pingInterval: 25000, // Ping every 25 seconds
});

// Middleware
app.use(express.json());

// Enable CORS for HTTP requests as well
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Static files (serve client files in production)
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Set up basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fight For Humanity server is running' });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes in production
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  } else {
    res.json({ message: 'API endpoint not found' });
  }
});

// Initialize game manager
const gameManager = new GameManager(io);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Player join
  socket.on(SOCKET_EVENTS.PLAYER_JOIN, ({ name, isHuman }) => {
    console.log(`Player ${name} joining as ${isHuman ? 'human' : 'AI'}`);
    gameManager.handlePlayerJoin(socket.id, name, isHuman);
  });

  // Player movement
  socket.on(SOCKET_EVENTS.PLAYER_MOVE, ({ position, rotation, velocity }) => {
    gameManager.handlePlayerMove(socket.id, position, rotation, velocity);
  });

  // Player shoot
  socket.on(SOCKET_EVENTS.PLAYER_SHOOT, ({ direction }) => {
    console.log(`Player ${socket.id} shooting`);
    gameManager.handlePlayerShoot(socket.id, direction);
  });

  // Player hit
  socket.on(SOCKET_EVENTS.PLAYER_HIT, ({ targetId }) => {
    console.log(`Player ${socket.id} hit player ${targetId}`);
    gameManager.handlePlayerHit(socket.id, targetId);
  });

  // Socket error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    gameManager.handlePlayerLeave(socket.id);
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
}); 