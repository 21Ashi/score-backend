require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Firebase init
const { initFirebase } = require('./config/firebase');

// Import routes
const messageRoutes = require('./routes/messages');
const imageRoutes = require('./routes/image');

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form data if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Init Firebase
initFirebase();

// Use routes
app.use('/', messageRoutes);
app.use('/', imageRoutes);

// Optional: Catch-all route
app.get('/', (req, res) => {
  res.send('✅ Backend is running!');
});

// Optional: Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// WebSocket setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  ws.send('👋 Hello from the server!');

  ws.on('message', (msg) => {
    console.log('📩 Message from client:', msg);
    ws.send(`You said: ${msg}`);
  });

  ws.on('close', () => {
    console.log('❌ WebSocket connection closed');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});