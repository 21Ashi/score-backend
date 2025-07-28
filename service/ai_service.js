const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function detectIngredientsWithGemini(imagePath) {
  try {
    console.log('🔍 Analyzing image with Gemini API...');
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Read and encode the image
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Create the prompt for ingredient detection
    const prompt = `
    Analyze this food image and identify all visible ingredients. Please provide your response in the following JSON format:

    {
      "ingredients": [
        {
          "name": "ingredient name",
          "confidence": 0.95,
          "category": "vegetable|fruit|protein|grain|dairy|spice|herb|condiment|other",
          "description": "brief description of what you see"
        }
      ],
      "dish_type": "what type of dish this appears to be",
      "cooking_method": "raw|cooked|prepared|mixed",
      "overall_confidence": 0.90
    }

    Be specific and accurate. Only include ingredients you can clearly identify. If you're unsure about something, lower the confidence score accordingly. Focus on individual ingredients rather than prepared dishes.
    `;
    
    // Create the image part
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };
    
    // Generate content
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Gemini raw response:', text);
    
    // Parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (parseError) {
      console.log('⚠️ Failed to parse JSON, attempting to extract...');
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Could not parse Gemini response as JSON');
      }
    }
    
    // Validate and enhance the result
    const enhancedResult = {
      success: true,
      timestamp: new Date().toISOString(),
      analysis_method: 'gemini-1.5-flash',
      ...parsedResult,
      ingredients: (parsedResult.ingredients || []).map(ingredient => ({
        ...ingredient,
        confidence: Math.round((ingredient.confidence || 0) * 100) / 100 // Ensure 2 decimal places
      }))
    };
    
    console.log('✅ Processed ingredients:', enhancedResult.ingredients.length);
    
    return enhancedResult;
    
  } catch (error) {
    console.error('❌ Error in Gemini ingredient detection:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      analysis_method: 'gemini-1.5-flash',
      ingredients: [],
      dish_type: 'unknown',
      cooking_method: 'unknown',
      overall_confidence: 0
    };
  }
}

// Alternative function for simpler ingredient list
async function getSimpleIngredientList(imagePath) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    const prompt = `
    Look at this food image and list all the ingredients you can identify. 
    Respond with only a simple comma-separated list of ingredient names.
    For example: "tomato, onion, garlic, olive oil, basil, mozzarella cheese"
    
    Be specific but concise. Only list ingredients you can clearly see.
    `;
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log('📝 Simple ingredient list:', text);
    
    // Convert to array and clean up
    const ingredients = text.split(',').map(item => item.trim()).filter(item => item.length > 0);
    
    return {
      success: true,
      ingredients: ingredients,
      raw_response: text,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in simple ingredient detection:', error);
    return {
      success: false,
      error: error.message,
      ingredients: []
    };
  }
}

module.exports = {
  detectIngredientsWithGemini,
  getSimpleIngredientList
};