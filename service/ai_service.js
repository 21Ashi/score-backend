exports.detectIngredientsFromImage = async (imageBuffer) => {
  // Simulate a delay like AI processing
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Dummy ingredient detection (replace with your AI logic)
  return ['tomato', 'onion', 'garlic'];
};

exports.getRecommendedRecipes = (ingredients) => {
  // Dummy recipe recommendations based on ingredients
  return [
    { id: 1, name: 'Tomato Soup', ingredients: ['tomato', 'onion', 'garlic'] },
    { id: 2, name: 'Garlic Pasta', ingredients: ['garlic', 'pasta', 'olive oil'] },
    { id: 3, name: 'Onion Salad', ingredients: ['onion', 'lettuce', 'lemon'] },
    { id: 4, name: 'Tomato Salad', ingredients: ['tomato', 'cucumber', 'feta cheese'] },
    { id: 5, name: 'Bruschetta', ingredients: ['tomato', 'garlic', 'bread'] },
  ];
};