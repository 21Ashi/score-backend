const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// ✅ Use FIREBASE_CONFIG from environment variable (base64-encoded JSON)
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_CONFIG, 'base64').toString('utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://cheflens-ce7f2.firebaseio.com',
});

const db = admin.firestore();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// ✅ WebSocket handler
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.send('👋 Hello from the server!');

  ws.on('message', (message) => {
    console.log('Received:', message);
    ws.send(`You said: ${message}`);
  });
});

// ✅ REST API to receive and store message
app.post('/send-message', async (req, res) => {
  const { user, message } = req.body;

  if (!user || !message) {
    return res.status(400).json({ error: 'Missing user or message' });
  }

  console.log(`Message from ${user}: ${message}`);

  try {
    await db.collection('messages').add({
      user,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      status: 'ok',
      reply: `Hello ${user}, your message is saved in Firebase!`,
    });
  } catch (e) {
    console.error('❌ Firestore Error:', e);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// ✅ Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});