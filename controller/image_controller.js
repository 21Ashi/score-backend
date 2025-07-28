const fs = require('fs');
const path = require('path');
const { getGeminiModel } = require('../config/gemini');

async function handleImageUpload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    const filePath = path.join(__dirname, '..', req.file.path);
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');

    const model = getGeminiModel();
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64,
        },
      },
      'List all food ingredients in the image, comma-separated only.',
    ]);

    const text = result.response.text();
    res.json({ status: 'ok', ingredients: text.split(',').map(i => i.trim()), raw: text });
  } catch (err) {
    console.error('❌ Gemini Error:', err);
    res.status(500).json({ error: 'AI failed' });
  }
}

module.exports = { handleImageUpload };