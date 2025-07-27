const express = require('express');
const http = require("http");
const WebSocket = require('ws');

const app = express();
app.use(express.json());


const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json"); // ✅ correct local path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cheflens-ce7f2.firebaseio.com" // ✅ required for admin access
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

// POST /send-message endpoint
app.post('/send-message', (req, res) => {
  const { user, message } = req.body;

  if (!user || !message) {
    return res.status(400).json({ error: 'Missing user or message' });
  }

  console.log(`Message from ${user}: ${message}`);

  // Respond back with confirmation + a friendly reply
  res.json({ 
    status: 'ok', 
    reply: `Hello ${user}, your message was received loud and clear!` 
  });
});



app.post('/send-message', async (req, res) => {
  const { user, message } = req.body;

  if (!user || !message) {
    return res.status(400).json({ error: 'Missing user or message' });
  }

  try {
    await db.collection('messages').add({
      user,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

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