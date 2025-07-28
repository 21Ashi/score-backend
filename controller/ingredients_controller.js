const { detectIngredientsFromImage } = require('../service/ai_service');
const { getFirestore } = require('../config/firebase');
const { suggestRecipesWithSpoonacular } = require('../service/recipe_suggestion');

// ✅ Get initialized Firestore instance
const firestore = getFirestore();

// ✅ Enhanced mapping function with more Spoonacular fields
function mapSpoonacularRecipeToJson(recipe) {
  return {
    // Basic identifiers
    id: recipe.id || null,
    spoonacularId: recipe.id || null,
    title: recipe.title || null,
    
    // Content and media
    description: recipe.summary ? recipe.summary.replace(/<[^>]+>/g, '') : null,
    imageUrl: recipe.image || null,
    imageType: recipe.imageType || null,
    sourceUrl: recipe.sourceUrl || null,
    spoonacularSourceUrl: recipe.spoonacularSourceUrl || null,
    
    // Ingredients and instructions
    ingredients: recipe.extendedIngredients
      ? recipe.extendedIngredients.map(ing => ({
          original: ing.original || ing.originalString || null,
          name: ing.name || null,
          amount: ing.amount || null,
          unit: ing.unit || null
        }))
      : [],
    instructions: recipe.analyzedInstructions?.[0]?.steps?.map(step => step.step) || 
                 (recipe.instructions ? [recipe.instructions.replace(/<[^>]+>/g, '')] : []),
    
    // Timing information
    preparationTime: recipe.preparationMinutes || null,
    cookingTime: recipe.cookingMinutes || null,
    totalTime: recipe.readyInMinutes || null,
    servings: recipe.servings || null,
    
    // Nutrition information
    calories: recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || null,
    protein: recipe.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || null,
    fat: recipe.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || null,
    carbs: recipe.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || null,
    nutritionInfo: recipe.nutrition || null,
    
    // Dietary restrictions and health info
    vegetarian: recipe.vegetarian || false,
    vegan: recipe.vegan || false,
    glutenFree: recipe.glutenFree || false,
    dairyFree: recipe.dairyFree || false,
    veryHealthy: recipe.veryHealthy || false,
    cheap: recipe.cheap || false,
    veryPopular: recipe.veryPopular || false,
    sustainable: recipe.sustainable || false,
    lowFodmap: recipe.lowFodmap || false,
    
    // Scoring and metrics
    healthScore: recipe.healthScore || null,
    spoonacularScore: recipe.spoonacularScore || null,
    weightWatcherSmartPoints: recipe.weightWatcherSmartPoints || null,
    aggregateLikes: recipe.aggregateLikes || 0,
    pricePerServing: recipe.pricePerServing || null,
    
    // Categories and classification
    tags: recipe.diets || [],
    cuisine: recipe.cuisines || [],
    category: recipe.dishTypes || [],
    occasions: recipe.occasions || [],
    difficulty: null, // This isn't provided by Spoonacular
    
    // Metadata
    author: recipe.sourceName || recipe.creditsText || null,
    license: recipe.license || null,
    rating: null, // You might want to implement your own rating system
    reviewCount: null,
    isFavorite: false,
    
    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: null,
    savedAt: new Date().toISOString(), // When user saved this recipe
  };
}

// ✅ Enhanced save function with error handling and validation
async function saveRecipesToFirestore(userId, recipes) {
  if (!userId || !recipes || recipes.length === 0) {
    throw new Error('Invalid userId or empty recipes array');
  }

  const batch = firestore.batch();
  const userRef = firestore.collection('Users').doc(userId);
  
  // Ensure user document exists
  batch.set(userRef, { 
    lastRecipeUpdate: new Date().toISOString(),
    totalRecipes: firestore.FieldValue.increment(recipes.length)
  }, { merge: true });

  recipes.forEach(recipe => {
    if (!recipe.id) {
      console.warn('⚠️ Recipe missing ID, skipping:', recipe.title);
      return;
    }
    
    const recipeRef = userRef.collection('recipes').doc(recipe.id.toString());
    batch.set(recipeRef, recipe, { merge: true });
  });

  await batch.commit();
  console.log(`✅ Saved ${recipes.length} recipes to Users/${userId}/recipes`);
  
  return {
    savedCount: recipes.length,
    userId: userId,
    timestamp: new Date().toISOString()
  };
}

// ✅ Helper function to get user's saved recipes
async function getUserRecipes(userId, limit = 20) {
  try {
    const userRecipesRef = firestore
      .collection('Users')
      .doc(userId)
      .collection('recipes')
      .orderBy('savedAt', 'desc')
      .limit(limit);
    
    const snapshot = await userRecipesRef.get();
    const recipes = [];
    
    snapshot.forEach(doc => {
      recipes.push({
        firestoreId: doc.id,
        ...doc.data()
      });
    });
    
    return recipes;
  } catch (error) {
    console.error('❌ Error fetching user recipes:', error);
    throw error;
  }
}

// ✅ Enhanced upload controller with better error handling
exports.uploadImage = async (req, res) => {
  try {
    console.log('📤 Controller: Image upload request received');
    
    // Validate file upload
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ 
        error: 'No image file uploaded', 
        success: false 
      });
    }

    // Validate userId
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing userId in request body', 
        success: false 
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP images only.',
        success: false
      });
    }

    const imageBuffer = req.file.buffer;
    
    // Detect ingredients
    console.log('🤖 Detecting ingredients...');
    const ingredients = await detectIngredientsFromImage(imageBuffer);
    console.log('🎉 Ingredients detected:', ingredients);

    if (!ingredients || ingredients.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No ingredients detected in the image',
        ingredients: [],
        count: 0,
        recipes: [],
        fileInfo: {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch recipe suggestions
    console.log('📡 Fetching recipe suggestions...');
    const recipes = await suggestRecipesWithSpoonacular(ingredients);
    console.log(`✅ ${recipes.length} recipes fetched`);

    // Map recipes to your format
    const mappedRecipes = recipes.map(mapSpoonacularRecipeToJson);
    
    // Save to Firestore
    console.log('📝 Saving to Firestore...');
    const saveResult = await saveRecipesToFirestore(userId, mappedRecipes);

    // Success response
    res.status(200).json({
      success: true,
      message: 'Image processed, ingredients detected, and recipes saved!',
      ingredients,
      ingredientCount: ingredients.length,
      recipes: mappedRecipes,
      recipeCount: mappedRecipes.length,
      saveResult,
      fileInfo: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error in uploadImage controller:', error);
    
    // Determine error type and send appropriate response
    if (error.message.includes('Invalid userId')) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.message : 'Bad request',
      });
    }
    
    res.status(500).json({
      error: 'Failed to process image or fetch recipes',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// ✅ Additional controller to get user's saved recipes
exports.getUserRecipes = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter',
        success: false
      });
    }
    
    const recipes = await getUserRecipes(userId, limit);
    
    res.status(200).json({
      success: true,
      recipes,
      count: recipes.length,
      userId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in getUserRecipes controller:', error);
    res.status(500).json({
      error: 'Failed to fetch user recipes',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

module.exports = {
  uploadImage: exports.uploadImage,
  getUserRecipes: exports.getUserRecipes,
  mapSpoonacularRecipeToJson,
  saveRecipesToFirestore,
};