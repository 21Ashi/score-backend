const { detectIngredientsFromImage } = require('../service/ai_service');
const { suggestRecipesWithGemini } = require('../service/recipe_suggestion');

// Map raw recipe object to expected JSON structure
function mapRecipeToJson(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    imageUrl: recipe.imageUrl || null,
    preparationTime: recipe.preparationTime,
    cookingTime: recipe.cookingTime || null,
    totalTime: recipe.totalTime || null,
    servings: recipe.servings || null,
    calories: recipe.calories || null,
    difficulty: recipe.difficulty || null,
    tags: recipe.tags || null,
    cuisine: recipe.cuisine || null,
    category: recipe.category || null,
    rating: recipe.rating || null,
    reviewCount: recipe.reviewCount || null,
    author: recipe.author || null,
    createdAt: recipe.createdAt ? new Date(recipe.createdAt).toISOString() : null,
    updatedAt: recipe.updatedAt ? new Date(recipe.updatedAt).toISOString() : null,
    isFavorite: recipe.isFavorite ?? false,
    nutritionInfo: recipe.nutritionInfo || null,
  };
}

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
    let recipes = await suggestRecipesWithGemini(ingredients);
    console.log('✅ Controller: Received recipe suggestions:', recipes);

    // 3. Map recipes to exact expected JSON structure
    const mappedRecipes = recipes.map(mapRecipeToJson);

    // 4. Respond with both ingredients and mapped recipes
    res.status(200).json({
      success: true,
      message: 'Image processed and ingredients detected successfully!',
      ingredients,
      count: ingredients.length,
      recipes: mappedRecipes,
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