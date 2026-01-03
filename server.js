const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4413;

// Enable CORS for all origins (SDK needs to be loaded from any domain)
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve the SDK with proper caching and content type
app.get('/v1/nafsi.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(__dirname, 'dist', 'nafsi.js'));
});

// Serve source map
app.get('/v1/nafsi.js.map', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(__dirname, 'dist', 'nafsi.js.map'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Version info endpoint
app.get('/v1/version', (req, res) => {
  res.json({
    version: '1.0.0',
    sdkUrl: `${req.protocol}://${req.get('host')}/v1/nafsi.js`,
    size: '32KB',
    lastUpdated: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    availableEndpoints: [
      '/v1/nafsi.js',
      '/v1/nafsi.js.map',
      '/v1/version',
      '/health'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Nafsi SDK CDN Server running on port ${PORT}`);
  console.log(`\n📦 SDK available at:`);
  console.log(`   https://sdk.nafsi.ai/v1/nafsi.js`);
  console.log(`   http://localhost:${PORT}/v1/nafsi.js (local)`);
  console.log(`\n🔍 Endpoints:`);
  console.log(`   GET /v1/nafsi.js       - SDK bundle`);
  console.log(`   GET /v1/nafsi.js.map   - Source map`);
  console.log(`   GET /v1/version        - Version info`);
  console.log(`   GET /health            - Health check`);
  console.log(`\n💡 Integration example:`);
  console.log(`   <script src="https://sdk.nafsi.ai/v1/nafsi.js"></script>\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
