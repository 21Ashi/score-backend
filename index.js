const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// ✅ Load Firebase credentials from env var
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

// ✅ WebSocket setup
wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');

  // Send a welcome message
  ws.send('👋 Hello from the server!');

  // Listen to messages from the client
  ws.on('message', (message) => {
    console.log('💬 WebSocket message:', message);

    // Echo back
    ws.send(`You said: ${message}`);
  });

  ws.on('close', () => {
    console.log('❌ WebSocket connection closed');
  });
});

// ✅ POST endpoint to save a message to Firestore
app.post('/send-message', async (req, res) => {
  const { user, message } = req.body;

  if (!user || !message) {
    return res.status(400).json({ error: 'Missing user or message' });
  }

  console.log(`📩 Message from ${user}: ${message}`);

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

// ✅ GET endpoint to fetch recent messages from Firestore
app.get('/messages', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  try {
    const snapshot = await db
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ messages });
  } catch (e) {
    console.error('❌ Error fetching messages:', e);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ✅ Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});