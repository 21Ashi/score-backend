const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ingredient-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Image upload endpoint
router.post('/upload-ingredient-image', upload.single('image'), (req, res) => {
  try {
    // Set headers to prevent connection issues
    res.setHeader('Connection', 'close');
    res.setHeader('Content-Type', 'application/json');
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image file uploaded',
        success: false 
      });
    }

    console.log('✅ Image uploaded successfully:', req.file.filename);
    
    // Return success response with file info
    const responseData = {
      success: true,
      message: 'Image uploaded successfully!',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      // Add any AI processing results here later
      aiResults: {
        // placeholder for future AI analysis
        detected: [],
        confidence: 0
      }
    };
    
    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      success: false,
      details: error.message 
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.',
        success: false
      });
    }
  }
  
  res.status(400).json({
    error: error.message,
    success: false
  });
});

module.exports = router;