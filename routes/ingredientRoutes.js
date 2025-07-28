const express = require('express');
const router = express.Router();
const ingredientController = require('../controller/ingredients_controller');
const multer = require('multer');

// Configure multer for memory storage (controller expects buffer)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// POST /api/ingredients/upload-image
router.post('/upload-image', upload.single('image'), ingredientController.uploadImage);

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.',
        success: false
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      error: 'Only image files are allowed.',
      success: false
    });
  }
  
  next(error);
});

module.exports = router;