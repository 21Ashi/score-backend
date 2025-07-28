require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const { initFirebase } = require('./config/firebase');
const messageRoutes = require('./routes/messages');
const imageRoutes = require('./routes/image');

const app = express();

// CORS for frontend connection
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Firebase (if needed)
initFirebase();

// Register routes
app.use('/', messageRoutes);
app.use('/', imageRoutes);

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');

  ws.send('👋 Hello from the server!');

  ws.on('message', (msg) => {
    console.log('📨 Message from client:', msg);
    ws.send(`You said: ${msg}`);
  });

  ws.on('close', () => {
    console.log('❌ WebSocket connection closed');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});