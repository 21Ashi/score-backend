const { initFirebase } = require('./firebase');
initFirebase();
require('dotenv').config();
const express = require('express');
const cors = require('cors');

console.log('🚀 Starting server...');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Import routes with correct paths
const imageRoutes = require('./routes/image');
const ingredientRoutes = require('./routes/ingredientRoutes');

// Use routes
app.use('/api', imageRoutes);
app.use('/api/ingredients', ingredientRoutes);

// Health check routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Score Backend API is running!', 
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Express error:', error);
  res.status(500).json({
    error: 'Internal server error',
    success: false
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});