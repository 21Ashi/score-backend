function extractNutrition(nutritionInfo = {}) {
  const nutrients = nutritionInfo.nutrients || [];

  const keyMap = {
    'Calories': 'calories',
    'Fat': 'fat',
    'Protein': 'protein',
    'Sodium': 'sodium',
    'Carbohydrates': 'carbohydrates',
    'Sugar': 'sugar',
    'Cholesterol': 'cholesterol',
    'Fiber': 'fiber',
    'Vitamin C': 'vitaminC',
    'Iron': 'iron',
    'Calcium': 'calcium',
  };

  const result = {};

  nutrients.forEach(n => {
    const key = keyMap[n.name];
    if (key && n.amount != null) {
      result[key] = Number(n.amount);
    }
  });

  if (nutritionInfo.caloricBreakdown) {
    result.percentProtein = nutritionInfo.caloricBreakdown.percentProtein;
    result.percentCarbs = nutritionInfo.caloricBreakdown.percentCarbs;
    result.percentFat = nutritionInfo.caloricBreakdown.percentFat;
  }

  return result;
}

module.exports = { extractNutrition };