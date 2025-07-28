const { detectIngredientsFromImage } = require('../service/ai_service');

exports.uploadImage = async (req, res) => {
  try {
    console.log('📤 Controller: Image upload request received');
    
    if (!req.file) {
      console.log('❌ Controller: No file in request');
      return res.status(400).json({ 
        error: 'No image file uploaded',
        success: false 
      });
    }

    console.log('✅ Controller: File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Get image buffer from multer memory storage
    const imageBuffer = req.file.buffer;
    
    // Use Gemini AI to detect ingredients
    console.log('🤖 Controller: Calling Gemini AI for ingredient detection...');
    const ingredients = await detectIngredientsFromImage(imageBuffer);

    console.log('🎉 Controller: Successfully detected ingredients:', ingredients);

    res.status(200).json({
      success: true,
      message: 'Image processed and ingredients detected successfully!',
      ingredients,
      count: ingredients.length,
      fileInfo: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Controller: Error processing image:', error);
    
    res.status(500).json({ 
      error: 'Failed to process image or detect ingredients',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};