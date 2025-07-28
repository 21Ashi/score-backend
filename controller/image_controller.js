const { detectIngredientsFromImage } = require('../service/ai_service');
const { getFirestore } = require('../config/firebase');
const { suggestRecipesWithSpoonacular } = require('../service/recipe_suggestion');

// 1. Recipe mapper
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

// 2. Save to Firestore
async function saveRecipesToFirestore(recipes) {
  const firestore = getFirestore();
  const batch = firestore.batch();

  recipes.forEach(recipe => {
    const docRef = firestore.collection('recipes').doc(recipe.id?.toString());
    batch.set(docRef, recipe, { merge: true });
  });

  await batch.commit();
  console.log('✅ Recipes saved to Firestore');
}

// 3. Upload Image Controller
exports.uploadImage = async (req, res) => {
  try {
    console.log('📤 Controller: Image upload request received');

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No image file uploaded', success: false });
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
    await saveRecipesToFirestore(mappedRecipes);

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