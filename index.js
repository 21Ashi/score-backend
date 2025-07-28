require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const app = express();

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// CORS for frontend connection
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize Firebase only if config exists
try {
  const { initFirebase } = require('./config/firebase');
  initFirebase();
  console.log('✅ Firebase initialized');
} catch (error) {
  console.log('⚠️ Firebase initialization skipped:', error.message);
}

// Register routes
try {
  const messageRoutes = require('./routes/messages');
  app.use('/', messageRoutes);
  console.log('✅ Message routes loaded');
} catch (error) {
  console.log('⚠️ Message routes not found:', error.message);
}

try {
  const imageRoutes = require('./routes/image');
  app.use('/', imageRoutes);
  console.log('✅ Image routes loaded');
} catch (error) {
  console.log('⚠️ Image routes not found:', error.message);
}

// Fallback route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Score Backend API is running!', 
    timestamp: new Date().toISOString(),
    endpoints: ['/health', '/upload-ingredient-image']
  });
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  ws.send('👋 Hello from the server!');

  ws.on('message', (msg) => {
    console.log('📨 Message from client:', msg.toString());
    ws.send(`You said: ${msg}`);
  });

  ws.on('close', () => {
    console.log('❌ WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});