const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/ingredients/upload-image
router.post('/upload-image', upload.single('image'), ingredientController.uploadImage);

module.exports = router;