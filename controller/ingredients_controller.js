const { detectIngredientsFromImage } = require('../service/ai_service');
const { suggestRecipesWithMealDB } = require('../service/recipe_suggestion'); // ✅ use MealDB now

// Optional mapper if you want to unify the shape
function mapMealDBRecipeToJson(recipe) {
  return {
    id: recipe.idMeal || null,
    title: recipe.title || recipe.strMeal,
    description: null,
    ingredients: recipe.ingredients || [],
    instructions: recipe.steps || [],
    imageUrl: recipe.thumbnail || recipe.strMealThumb || null,
    preparationTime: null,
    cookingTime: null,
    totalTime: null,
    servings: null,
    calories: null,
    difficulty: null,
    tags: null,
    cuisine: null,
    category: null,
    rating: null,
    reviewCount: null,
    author: null,
    createdAt: null,
    updatedAt: null,
    isFavorite: false,
    nutritionInfo: null,
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
    console.log('🤖 Controller: Calling AI service to detect ingredients...');
    const ingredients = await detectIngredientsFromImage(imageBuffer);
    console.log('🎉 Detected ingredients:', ingredients);

    // 2. Suggest recipes using TheMealDB
    console.log('📡 Fetching recipe suggestions from TheMealDB...');
    let recipes = await suggestRecipesWithMealDB(ingredients);
    console.log('✅ Recipe suggestions received:', recipes);

    // 3. Normalize recipe structure
    const mappedRecipes = recipes.map(mapMealDBRecipeToJson);

    // 4. Respond with everything
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