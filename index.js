const express = require('express');
const http = require("http");
const WebSocket = require('ws');

const app = express();
app.use(express.json());

const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require(path.join(__dirname, "firebase-service-account.json"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cheflens-ce7f2.firebaseio.com"
});

const db = admin.firestore();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send a welcome message to the user
  ws.send("👋 Hello from the Testttttttttt!");

  // Receive messages from the client
  ws.on("message", (message) => {
    console.log("Received:", message);

    // Send a reply
    ws.send(`You said: ${message}`);
  });
});

// Single POST /send-message endpoint
app.post('/send-message', async (req, res) => {
  const { user, message } = req.body;

  if (!user || !message) {
    return res.status(400).json({ error: 'Missing user or message' });
  }

  console.log(`Message from ${user}: ${message}`);

  try {
    // Save message to Firestore
    await db.collection('messages').add({
      user,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Respond back with confirmation
    res.json({ 
      status: 'ok', 
      reply: `Hello ${user}, your message is saved in Firebase!` 
    });

  } catch (e) {
    console.error('❌ Firestore Error:', e);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});