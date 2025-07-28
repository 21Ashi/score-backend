// service/recipe_suggestion.js
const { getTextModel } = require('../config/gemini');

const suggestRecipesWithGemini = async (ingredients) => {
  const model = getTextModel();

  const prompt = `
I have the following ingredients: ${ingredients.join(', ')}.
Suggest 3 different meal recipes I can make using them. For each recipe, include:
- Title
- List of ingredients
- Steps
Return the response as pure JSON in this format:
[
  {
    "title": "...",
    "ingredients": ["...", "..."],
    "steps": ["...", "..."]
  },
  ...
]
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up Gemini's response
    const jsonString = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ Error suggesting recipes from Gemini:', error);
    return [];
  }
};

module.exports = { suggestRecipesWithGemini };