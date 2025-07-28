const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { detectIngredientsFromImage } = require('./ai_service');

const router = express.Router();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.post('/upload-ingredient-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const imageBuffer = fs.readFileSync(req.file.path);

    const ingredients = await detectIngredientsFromImage(imageBuffer);

    res.json({
      success: true,
      ingredients,
      filename: req.file.filename,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

module.exports = router;