const { detectIngredientsFromImage } = require('../service/ai_service');
const { getFirestore } = require('../config/firebase');
const { suggestRecipesWithSpoonacular } = require('../service/recipe_suggestion');

// ✅ Get initialized Firestore instance
const firestore = getFirestore();

// ✅ 1. Map Spoonacular recipe to your Firestore format
function mapSpoonacularRecipeToJson(recipe) {
  return {
    id: recipe.id || null,
    title: recipe.title || null,
    description: recipe.summary ? recipe.summary.replace(/<[^>]+>/g, '') : null,
    ingredients: recipe.extendedIngredients
      ? recipe.extendedIngredients.map(ing => ing.original || ing.originalString)
      : [],
    instructions: recipe.analyzedInstructions?.[0]?.steps?.map(step => step.step) || [],
    imageUrl: recipe.image || null,
    preparationTime: recipe.preparationMinutes || null,
    cookingTime: recipe.cookingMinutes || null,
    totalTime: recipe.readyInMinutes || null,
    servings: recipe.servings || null,
    calories: recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || null,
    difficulty: null,
    tags: recipe.diets || null,
    cuisine: recipe.cuisines || null,
    category: recipe.dishTypes || null,
    rating: null,
    reviewCount: null,
    author: recipe.sourceName || null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    isFavorite: false,
    nutritionInfo: recipe.nutrition || null,
  };
}

// ✅ 2. Save mapped recipes to Firestore under Users/{userId}/recipes
async function saveRecipesToFirestore(userId, recipes) {
  const batch = firestore.batch();
  const userRef = firestore.collection('Users').doc(userId);

  recipes.forEach(recipe => {
    const recipeRef = userRef.collection('recipes').doc(recipe.id.toString());
    batch.set(recipeRef, recipe, { merge: true });
  });

  await batch.commit();
  console.log(`✅ Saved ${recipes.length} recipes to Users/${userId}/recipes`);
}

// ✅ 3. Upload controller
exports.uploadImage = async (req, res) => {
  try {
    console.log('📤 Controller: Image upload request received');

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No image file uploaded', success: false });
    }

    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId in request body', success: false });
    }

    const imageBuffer = req.file.buffer;

    console.log('🤖 Detecting ingredients...');
    const ingredients = await detectIngredientsFromImage(imageBuffer);
    console.log('🎉 Ingredients detected:', ingredients);

    console.log('📡 Fetching recipe suggestions...');
    const recipes = await suggestRecipesWithSpoonacular(ingredients);
    console.log(`✅ ${recipes.length} recipes fetched`);

    const mappedRecipes = recipes.map(mapSpoonacularRecipeToJson);

    console.log('📝 Saving to Firestore...');
    await saveRecipesToFirestore(userId, mappedRecipes);

    res.status(200).json({
      success: true,
      message: 'Image processed, ingredients detected, and recipes saved!',
      ingredients,
      count: ingredients.length,
      recipes: mappedRecipes,
      fileInfo: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error in uploadImage controller:', error);
    res.status(500).json({
      error: 'Failed to process image or fetch recipes',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};