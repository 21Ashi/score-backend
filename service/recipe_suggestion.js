// service/recipe_suggestion.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ✅ Your API Key (do NOT commit this in production)
const genAI = new GoogleGenerativeAI('AIzaSyBa47pCYvE_9lnuEa4_Fhulkt8HLEiVl_M');

// Get the correct Gemini model
const getTextModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-pro" });
};

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
    "title": "string",
    "ingredients": ["string"],
    "steps": ["string"]
  },
  ...
]
`;

  try {
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const response = await result.response;
    const text = await response.text();

    // Remove markdown JSON block if present
    const jsonString = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ Error suggesting recipes from Gemini:', error.message || error);
    return [];
  }
};

module.exports = { suggestRecipesWithGemini };