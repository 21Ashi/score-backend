// config/gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🧠 Return the text-based model (not vision)
function getTextModel() {
  return genAI.getGenerativeModel({ model: 'gemini-pro' }); // not 'gemini-pro-vision'
}

module.exports = { getTextModel };