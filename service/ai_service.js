const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI('AIzaSyBa47pCYvE_9lnuEa4_Fhulkt8HLEiVl_M');

exports.detectIngredientsFromImage = async (imageBuffer) => {
  try {
    // Get the generative model (Gemini Pro Vision)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert image buffer to base64
    const imageBase64 = imageBuffer.toString('base64');
    
    // Create the image part for Gemini
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg" // or "image/png" depending on your image type
      }
    };

    // Create a detailed prompt for ingredient detection
    const prompt = `
    Analyze this image and identify all food ingredients, food items, and cooking ingredients visible in the picture. 
    Return only a JSON array of ingredient names in lowercase, without any additional text or explanation.
    Focus on individual ingredients rather than prepared dishes.
    
    Example format: ["tomato", "onion", "garlic", "olive oil", "basil"]
    
    If no clear ingredients are visible, return an empty array: []
    `;

    // Generate content with the image and prompt
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Gemini raw response:', text);

    // Try to parse the JSON response
    let ingredients = [];
    try {
      // Clean the response text (remove any markdown formatting)
      const cleanText = text.replace(/```json|```/g, '').trim();
      ingredients = JSON.parse(cleanText);
      
      // Ensure it's an array
      if (!Array.isArray(ingredients)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.log('⚠️ Failed to parse JSON, attempting text extraction...');
      
      // Fallback: extract ingredients from text response
      const lines = text.toLowerCase().split('\n');
      ingredients = [];
      
      for (const line of lines) {
        // Look for common ingredient patterns
        if (line.includes('ingredient') || line.includes('food') || line.includes('-')) {
          const cleaned = line
            .replace(/[^\w\s]/g, ' ') // Remove special characters
            .replace(/\b(ingredient|food|item|visible|see|detect)\b/g, '') // Remove common words
            .trim();
          
          if (cleaned && cleaned.length > 2) {
            ingredients.push(cleaned);
          }
        }
      }
      
      // If still no ingredients found, try to extract any food-related words
      if (ingredients.length === 0) {
        const foodKeywords = [
          'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'potato', 'lettuce',
          'chicken', 'beef', 'fish', 'egg', 'milk', 'cheese', 'bread',
          'rice', 'pasta', 'oil', 'salt', 'sugar', 'flour', 'butter'
        ];
        
        const textLower = text.toLowerCase();
        ingredients = foodKeywords.filter(keyword => textLower.includes(keyword));
      }
    }

    // Clean and filter ingredients
    ingredients = ingredients
      .map(ingredient => ingredient.toString().toLowerCase().trim())
      .filter(ingredient => ingredient.length > 2)
      .slice(0, 10); // Limit to 10 ingredients max

    console.log('🥕 Detected ingredients:', ingredients);
    return ingredients;

  } catch (error) {
    console.error('❌ Gemini API error:', error);
    throw new Error(`Failed to detect ingredients: ${error.message}`);
  }
};