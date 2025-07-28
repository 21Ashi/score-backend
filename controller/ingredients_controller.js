const { detectIngredientsFromImage } = require('../service/ai_service');
const { suggestRecipesWithSpoonacular } = require('../service/recipe_suggestion'); // Use Spoonacular now

// Spoonacular recipe mapper to unify structure
function mapSpoonacularRecipeToJson(recipe) {
  return {
    id: recipe.id || null,
    title: recipe.title || null,
    description: recipe.summary || null,
    ingredients: recipe.extendedIngredients
      ? recipe.extendedIngredients.map(ing => ing.original) 
      : [],
    instructions: recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0
      ? recipe.analyzedInstructions[0].steps.map(step => step.step)
      : [],
    imageUrl: recipe.image || null,
    preparationTime: recipe.preparationMinutes || null,
    cookingTime: recipe.cookingMinutes || null,
    totalTime: recipe.readyInMinutes || null,
    servings: recipe.servings || null,
    calories: recipe.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount || null,
    difficulty: null,   // Spoonacular does not provide difficulty directly
    tags: recipe.diets || null,
    cuisine: recipe.cuisines || null,
    category: recipe.dishTypes || null,
    rating: null,
    reviewCount: null,
    author: null,
    createdAt: null,
    updatedAt: null,
    isFavorite: false,
    nutritionInfo: recipe.nutrition || null,
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

    // 2. Suggest recipes using Spoonacular
    console.log('📡 Fetching recipe suggestions from Spoonacular...');
    let recipes = await suggestRecipesWithSpoonacular(ingredients);
    console.log('✅ Recipe suggestions received:', recipes);

    // 3. Normalize recipe structure
    const mappedRecipes = recipes.map(mapSpoonacularRecipeToJson);

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