const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { detectIngredientsWithGemini, getSimpleIngredientList } = require('./gemini-detection');

console.log('🚀 Starting server...');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
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
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Score Backend API with Gemini AI is running!', 
    timestamp: new Date().toISOString(),
    status: 'healthy',
    features: ['image_upload', 'ingredient_detection']
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    gemini_configured: !!process.env.GEMINI_API_KEY
  });
});

// Image upload endpoint with AI detection
app.post('/upload-ingredient-image', upload.single('image'), async (req, res) => {
  try {
    console.log('📤 Upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ 
        error: 'No image file uploaded',
        success: false 
      });
    }

    console.log('✅ File uploaded:', req.file.filename);
    
    const imagePath = req.file.path;
    let aiAnalysis = null;
    
    // Check if Gemini API key is configured
    if (process.env.GEMINI_API_KEY) {
      console.log('🤖 Starting AI analysis...');
      
      try {
        // Get detailed analysis or simple list based on query parameter
        const useSimple = req.query.simple === 'true';
        
        if (useSimple) {
          aiAnalysis = await getSimpleIngredientList(imagePath);
        } else {
          aiAnalysis = await detectIngredientsWithGemini(imagePath);
        }
        
        console.log('🎯 AI analysis completed');
        
      } catch (aiError) {
        console.error('❌ AI analysis failed:', aiError.message);
        aiAnalysis = {
          success: false,
          error: 'AI analysis failed: ' + aiError.message,
          ingredients: []
        };
      }
    } else {
      console.log('⚠️ Gemini API key not configured');
      aiAnalysis = {
        success: false,
        error: 'AI detection not configured - missing GEMINI_API_KEY',
        ingredients: []
      };
    }
    
    const responseData = {
      success: true,
      message: 'Image uploaded and analyzed successfully!',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
        url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      },
      ai_analysis: aiAnalysis,
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload and analyze image',
      success: false,
      details: error.message 
    });
  }
});

// Analyze existing image endpoint
app.post('/analyze-image/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Image file not found'
      });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'AI detection not configured - missing GEMINI_API_KEY'
      });
    }
    
    console.log('🔍 Re-analyzing existing image:', filename);
    
    const useSimple = req.query.simple === 'true';
    let analysis;
    
    if (useSimple) {
      analysis = await getSimpleIngredientList(imagePath);
    } else {
      analysis = await detectIngredientsWithGemini(imagePath);
    }
    
    res.json({
      success: true,
      filename: filename,
      analysis: analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Express error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.',
        success: false
      });
    }
  }
  
  res.status(500).json({
    error: 'Internal server error',
    success: false
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});