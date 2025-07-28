const axios = require('axios');

const SPOONACULAR_API_KEY = 'b0d2212648444a93bc93358e2804f314';
const BASE_URL = 'https://api.spoonacular.com';

const suggestRecipesWithSpoonacular = async (ingredients) => {
  if (!ingredients || ingredients.length === 0) return [];

  try {
    // Join ingredients by comma (Spoonacular expects comma separated)
    const ingredientsParam = ingredients.join(',');

    // Fetch recipes that use the provided ingredients
    const response = await axios.get(`${BASE_URL}/recipes/findByIngredients`, {
      params: {
        ingredients: ingredientsParam,
        number: 5,        // number of recipes to return
        ranking: 1,       // maximize used ingredients
        apiKey: SPOONACULAR_API_KEY,
      },
    });

    const data = response.data; // Array of recipe summaries

    // For each recipe, fetch detailed info to get full instructions, nutrition, etc.
    const detailedRecipes = await Promise.all(
      data.map(async (recipeSummary) => {
        try {
          const detailsResponse = await axios.get(`${BASE_URL}/recipes/${recipeSummary.id}/information`, {
            params: {
              includeNutrition: true,
              apiKey: SPOONACULAR_API_KEY,
            },
          });
          return detailsResponse.data;
        } catch {
          return null;
        }
      })
    );

    // Filter out any failed fetches
    return detailedRecipes.filter((r) => r !== null);
  } catch (error) {
    console.error('❌ Error fetching recipes from Spoonacular:', error.message || error);
    return [];
  }
};

module.exports = { suggestRecipesWithSpoonacular };