const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { detectIngredientsFromImage } = require('../service/ai_service');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ingredient-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Test endpoint to verify Gemini API connection
router.get('/test-gemini', async (req, res) => {
  try {
    console.log('🧪 Testing Gemini API connection...');
    
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const API_KEY = 'AIzaSyBa47pCYvE_9lnuEa4_Fhulkt8HLEiVl_M';
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Say hello and confirm you're working!";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini API test successful:', text);

    res.json({
      success: true,
      message: 'Gemini API is working!',
      geminiResponse: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Gemini API test failed',
      details: error.message
    });
  }
});

// POST endpoint for ingredient detection from image
router.post('/upload-ingredient-image', upload.single('image'), async (req, res) => {
  try {
    console.log('📤 Image upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ 
        error: 'No image file uploaded',
        success: false 
      });
    }

    console.log('✅ File uploaded:', req.file.filename);
    console.log('📝 File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Read the uploaded image
    const imageBuffer = fs.readFileSync(req.file.path);
    
    // Use Gemini AI to detect ingredients
    console.log('🤖 Calling Gemini AI for ingredient detection...');
    const ingredients = await detectIngredientsFromImage(imageBuffer);

    // Clean up: optionally delete the uploaded file after processing
    // fs.unlinkSync(req.file.path);

    console.log('🎉 Successfully detected ingredients:', ingredients);

    res.status(200).json({
      success: true,
      message: 'Image processed and ingredients detected successfully!',
      filename: req.file.filename,
      ingredients,
      count: ingredients.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error processing image:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('⚠️ Failed to cleanup file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to process image or detect ingredients',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.',
        success: false
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field name. Use "image" field name.',
        success: false
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      error: 'Only image files are allowed. Please upload a valid image.',
      success: false
    });
  }
  
  next(error);
});

module.exports = router;