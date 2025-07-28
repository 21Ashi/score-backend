require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { initFirebase } = require('./config/firebase');
const messageRoutes = require('./routes/messages');
const imageRoutes = require('./routes/image');

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Init Firebase
initFirebase();

// Routes
app.use('/', messageRoutes);
app.use('/', imageRoutes);

// WebSocket setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  ws.send('👋 Hello from the server!');
  ws.on('message', (msg) => ws.send(`You said: ${msg}`));
  ws.on('close', () => console.log('❌ WebSocket closed'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));