const aiService = require('../services/aiService');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Simulate AI image processing to detect ingredients
    const ingredients = await aiService.detectIngredientsFromImage(req.file.buffer);

    // TODO: Save detected ingredients in Firestore if you want

    // Return detected ingredients and dummy recipe recommendations
    const recommendedRecipes = aiService.getRecommendedRecipes(ingredients);

    res.json({
      status: 'ok',
      ingredients,
      recommendedRecipes,
    });
  } catch (error) {
    console.error('Error in uploadImage:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
};