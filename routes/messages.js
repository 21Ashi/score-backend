const express = require('express');
const router = express.Router();
const { admin } = require('../config/firebase');

router.post('/send-message', async (req, res) => {
  const { user, message } = req.body;
  if (!user || !message) return res.status(400).json({ error: 'Missing user or message' });

  try {
    const db = admin.firestore();
    await db.collection('messages').add({
      user,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ status: 'ok', reply: `Message from ${user} saved!` });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

router.get('/messages', async (req, res) => {
  const db = admin.firestore();
  try {
    const snapshot = await db.collection('messages').orderBy('timestamp', 'desc').limit(20).get();
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ messages });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;