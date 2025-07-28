const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  // TODO: Call AI image recognition service here, e.g., Google Vision, or your own model
  // For now, simulate detection:
  const detectedIngredients = ['tomato', 'onion', 'garlic'];

  res.json({
    status: 'ok',
    ingredients: detectedIngredients,
    recommendedRecipes: [
      { id: 1, name: 'Tomato Soup' },
      { id: 2, name: 'Garlic Bread' },
      { id: 3, name: 'Onion Rings' },
    ],
  });
});

module.exports = router;