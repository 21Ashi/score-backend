const vision = require('@google-cloud/vision');

// Initialize Google Vision client (set your credentials via env var or JSON file)
const client = new vision.ImageAnnotatorClient();

exports.detectIngredientsFromImage = async (imageBuffer) => {
  const [result] = await client.labelDetection({ image: { content: imageBuffer } });
  const labels = result.labelAnnotations;

  // Extract descriptions
  const ingredients = labels.map(label => label.description.toLowerCase());

  return ingredients;
};