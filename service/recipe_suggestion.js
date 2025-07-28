// service/recipe_suggestion.js
const axios = require('axios');

// ✅ Suggest recipes using TheMealDB based on ingredients
const suggestRecipesWithMealDB = async (ingredients) => {
  const joinedIngredients = ingredients.join(',');

  const filterUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${joinedIngredients}`;

  try {
    // Step 1: Search for meals using ingredients
    const filterRes = await axios.get(filterUrl);
    const basicMeals = filterRes.data.meals;

    if (!basicMeals) return [];

    // Step 2: Get full details for top 3 meals
    const detailedMeals = await Promise.all(
      basicMeals.slice(0, 3).map(async (meal) => {
        const detailUrl = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`;
        const detailRes = await axios.get(detailUrl);
        const fullMeal = detailRes.data.meals[0];

        const extractedIngredients = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = fullMeal[`strIngredient${i}`];
          const measure = fullMeal[`strMeasure${i}`];
          if (ingredient && ingredient.trim()) {
            extractedIngredients.push(`${measure.trim()} ${ingredient.trim()}`.trim());
          }
        }

        return {
          title: fullMeal.strMeal,
          ingredients: extractedIngredients,
          steps: fullMeal.strInstructions.split('\n').filter(line => line.trim() !== ''),
          thumbnail: fullMeal.strMealThumb,
        };
      })
    );

    return detailedMeals;
  } catch (error) {
    console.error('❌ Error suggesting recipes from TheMealDB:', error.message || error);
    return [];
  }
};

module.exports = { suggestRecipesWithMealDB };