const { detectIngredientsFromImage } = require('../service/ai_service');
const { suggestRecipesWithSpoonacular } = require('../service/recipe_suggestion');
const { mapSpoonacularRecipeToJson } = require('../utils/recipe_mapper'); // ✅ Import recipe mapper
const { initFirebase, getFirestore } = require('../config/firebase');     // ✅ Firebase utilities

initFirebase(); // 🔥 Ensure Firebase is initialized once

exports.uploadImage = async (req, res) => {
  try {
    console.log('📤 Controller: Image upload request received');

    // 1. Check if file exists
    if (!req.file) {
      console.log('❌ Controller: No file in request');
      return res.status(400).json({ 
        error: 'No image file uploaded',
        success: false 
      });
    }

    // 2. Validate userId
    const userId = req.body.userId;
    if (!userId) {
      console.log('❌ Controller: Missing userId');
      return res.status(400).json({ error: 'Missing userId', success: false });
    }

    // 3. Process image buffer
    const imageBuffer = req.file.buffer;
    console.log('🧠 Detecting ingredients...');
    const ingredients = await detectIngredientsFromImage(imageBuffer);
    console.log('🎉 Detected ingredients:', ingredients);

    // 4. Get recipes from Spoonacular
    console.log('📡 Suggesting recipes...');
    const recipes = await suggestRecipesWithSpoonacular(ingredients);
    const mappedRecipes = recipes.map(mapSpoonacularRecipeToJson);
    console.log(`🍳 Found ${mappedRecipes.length} recipes`);

    // 5. Save to Firestore
    const firestore = getFirestore();
    const scanRef = firestore.collection('users').doc(userId).collection('scans').doc();

    await scanRef.set({
      ingredients,
      recipes: mappedRecipes,
      createdAt: new Date().toISOString(),
      fileInfo: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });

    // 6. Send success response
    res.status(200).json({
      success: true,
      message: 'Image processed and ingredients detected successfully!',
      ingredients,
      count: ingredients.length,
      recipes: mappedRecipes,
      recipeCount: mappedRecipes.length,
      saveResult: { saved: true },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Controller: Error processing image:', error);

    res.status(500).json({ 
      error: 'Failed to process image or detect ingredients',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};