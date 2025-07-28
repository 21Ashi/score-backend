const { detectIngredientsFromImage } = require('../service/ai_service');
const { firestore } = require('../firebase');
const { suggestRecipesWithSpoonacular } = require('../service/recipe_suggestion');

// Map Spoonacular recipe to your app's JSON structure
function mapSpoonacularRecipeToJson(recipe) {
  return {
    id: recipe.id || null,
    title: recipe.title || null,
    description: recipe.summary ? recipe.summary.replace(/<[^>]+>/g, '') : null, // strip HTML tags
    ingredients: recipe.extendedIngredients
      ? recipe.extendedIngredients.map(i => i.originalString || i.original)
      : [],
    instructions: recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0
      ? recipe.analyzedInstructions[0].steps.map(s => s.step)
      : (recipe.instructions ? [recipe.instructions] : []),
    imageUrl: recipe.image || null,
    preparationTime: recipe.preparationMinutes || null,
    cookingTime: recipe.cookingMinutes || null,
    totalTime: recipe.readyInMinutes || null,
    servings: recipe.servings || null,
    calories: recipe.nutrition && recipe.nutrition.nutrients
      ? recipe.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || null
      : null,
    difficulty: null,
    tags: recipe.diets || null,
    cuisine: recipe.cuisines || null,
    category: recipe.dishTypes || null,
    rating: null,
    reviewCount: null,
    author: recipe.sourceName || null,
    createdAt: null,
    updatedAt: null,
    isFavorite: false,
    nutritionInfo: recipe.nutrition || null,
  };
}

async function saveRecipesToFirestore(recipes) {
  const batch = firestore.batch();
  recipes.forEach(recipe => {
    const docRef = firestore.collection('recipes').doc(recipe.id.toString());
    batch.set(docRef, recipe, { merge: true });
  });
  await batch.commit();
  console.log('✅ Recipes saved to Firestore');
}

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded', success: false });
    }
    const imageBuffer = req.file.buffer;
    const ingredients = await detectIngredientsFromImage(imageBuffer);
    const recipes = await suggestRecipesWithSpoonacular(ingredients);
    const mappedRecipes = recipes.map(mapSpoonacularRecipeToJson);

    await saveRecipesToFirestore(mappedRecipes);

    res.status(200).json({
      success: true,
      message: 'Image processed and ingredients detected successfully!',
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
    console.error('❌ Error processing image or fetching recipes:', error.message || error);
    res.status(500).json({
      error: 'Failed to process image or fetch recipes',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};