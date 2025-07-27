const express = require('express');
const http = require("http");
const WebSocket = require('ws');
const cors = require('cors'); // Add CORS support
const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for Flutter web if needed

// Firebase Admin SDK setup
const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require(path.join(__dirname, "firebase-service-account.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cheflens-ce7f2-default-rtdb.firebaseio.com" // Updated URL format
});

const db = admin.firestore();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

// Store connected clients for broadcasting
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);
  
  // Send a welcome message to the user
  ws.send(JSON.stringify({
    type: 'welcome',
    message: '👋 Hello from the Server! Connected to Firebase!'
  }));

  // Receive messages from the client
  ws.on("message", async (data) => {
    try {
      const messageData = JSON.parse(data);
      console.log("Received:", messageData);
      
      // Save WebSocket message to Firebase
      if (messageData.type === 'chat' && messageData.user && messageData.message) {
        await db.collection('websocket_messages').add({
          user: messageData.user,
          message: messageData.message,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          source: 'websocket'
        });
        
        // Broadcast to all connected clients
        const broadcastMessage = JSON.stringify({
          type: 'chat',
          user: messageData.user,
          message: messageData.message,
          timestamp: new Date().toISOString()
        });
        
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastMessage);
          }
        });
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  // Handle client disconnect
  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  // Handle WebSocket errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
});

// HTTP POST endpoint - saves to Firebase and returns response
app.post('/send-message', async (req, res) => {
  const { user, message } = req.body;
  
  if (!user || !message) {
    return res.status(400).json({ error: 'Missing user or message' });
  }

  console.log(`HTTP Message from ${user}: ${message}`);

  try {
    // Save message to Firestore
    const docRef = await db.collection('messages').add({
      user,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: 'http'
    });

    console.log('✅ Message saved to Firebase with ID:', docRef.id);

    // Respond back with confirmation
    res.json({
      status: 'success',
      reply: `Hello ${user}, your message "${message}" is saved in Firebase!`,
      messageId: docRef.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Firestore Error:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to save message to Firebase',
      details: error.message 
    });
  }
});

// GET endpoint to retrieve messages from Firebase
app.get('/messages', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messagesSnapshot = await db.collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const messages = [];
    messagesSnapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toISOString()
      });
    });

    res.json({
      status: 'success',
      messages: messages.reverse() // Show oldest first
    });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to fetch messages from Firebase' 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running and connected to Firebase',
    timestamp: new Date().toISOString(),
    connectedClients: clients.size
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`🔥 Firebase connected`);
});