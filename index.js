const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// POST /send-message
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});