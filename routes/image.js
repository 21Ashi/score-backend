const express = require('express');
const router = express.Router();

// Example: Simple placeholder route for image upload
router.post('/upload-ingredient-image', (req, res) => {
  // TODO: handle image upload and AI processing here
  res.json({ message: 'Image upload endpoint - coming soon!' });
});

module.exports = router;