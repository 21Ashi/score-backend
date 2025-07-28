const { detectIngredientsFromImage } = require('../service/ai_service');
const { suggestRecipesWithGemini } = require('../service/recipe_suggestion');

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

    const imageBuffer = req.file.buffer;

    // 1. Detect ingredients from image
    console.log('🤖 Controller: Calling Gemini AI for ingredient detection...');
    const ingredients = await detectIngredientsFromImage(imageBuffer);
    console.log('🎉 Controller: Successfully detected ingredients:', ingredients);

    // 2. Suggest recipes based on ingredients
    console.log('📡 Controller: Requesting recipe suggestions from Gemini...');
    const recipes = await suggestRecipesWithGemini(ingredients);
    console.log('✅ Controller: Received recipe suggestions:', recipes);

    // 3. Respond with both ingredients and recipes
    res.status(200).json({
      success: true,
      message: 'Image processed and ingredients detected successfully!',
      ingredients,
      count: ingredients.length,
      recipes,
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