// Add this test endpoint to your image.js or create a separate test route

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Test endpoint to verify Gemini API connection
router.get('/test-gemini', async (req, res) => {
  try {
    console.log('🧪 Testing Gemini API connection...');
    
    const API_KEY = 'AIzaSyBa47pCYvE_9lnuEa4_Fhulkt8HLEiVl_M';
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Say hello and confirm you're working!";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini API test successful:', text);

    res.json({
      success: true,
      message: 'Gemini API is working!',
      geminiResponse: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Gemini API test failed',
      details: error.message
    });
  }
});