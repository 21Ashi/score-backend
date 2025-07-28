const { detectIngredientsFromImage } = require('../service/ai_service');
const { suggestRecipesWithSpoonacular } = require('../service/recipe_suggestion');
const { initFirebase, getFirestore } = require('../config/firebase'); // 🔥 Import firebase utils

initFirebase(); // ✅ Make sure Firebase is initialized

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

    const userId = req.body.userId; // 🔥 Read userId from request
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId', success: false });
    }

    const imageBuffer = req.file.buffer;

    // 1. Detect ingredients
    const ingredients = await detectIngredientsFromImage(imageBuffer);

    // 2. Get Spoonacular recipes
    let recipes = await suggestRecipesWithSpoonacular(ingredients);
    const mappedRecipes = recipes.map(mapSpoonacularRecipeToJson);

    // 3. Save to Firestore 🔥
    const firestore = getFirestore();

    // Create a document under: users/{userId}/scans/{auto_id}
    const scanRef = firestore.collection('users').doc(userId).collection('scans').doc();

    await scanRef.set({
      ingredients,
      recipes: mappedRecipes,
      createdAt: new Date().toISOString(),
      fileInfo: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });

    // 4. Return response
    res.status(200).json({
      success: true,
      message: 'Image processed and ingredients detected successfully!',
      ingredients,
      count: ingredients.length,
      recipes: mappedRecipes,
      recipeCount: mappedRecipes.length,
      saveResult: { saved: true },
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