// utils/recipe_mapper.js
function mapSpoonacularRecipeToJson(recipe) {
  return {
    id: recipe.id || null,
    title: recipe.title || null,
    description: recipe.summary || null,
    ingredients: recipe.extendedIngredients
      ? recipe.extendedIngredients.map(ing => ing.original) 
      : [],
    instructions: recipe.analyzedInstructions?.[0]?.steps?.map(step => step.step) || [],
    imageUrl: recipe.image || null,
    preparationTime: recipe.preparationMinutes || null,
    cookingTime: recipe.cookingMinutes || null,
    totalTime: recipe.readyInMinutes || null,
    servings: recipe.servings || null,
    calories: recipe.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount || null,
    difficulty: null,
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

module.exports = { mapSpoonacularRecipeToJson };