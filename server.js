const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4413;

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

// Serve static files from public directory
// This will serve public/v1/nafsi.js at /v1/nafsi.js
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    }
    if (path.endsWith('.map')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Verify endpoint - serves dynamic HTML with query parameters
app.get('/v1/verify', (req, res) => {
  const { workflowId, clientId, apiUrl } = req.query;

  // Validate required parameters
  if (!workflowId || !clientId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required parameters: workflowId and clientId are required',
      usage: '/v1/verify?workflowId=xxx&clientId=yyy&apiUrl=zzz (apiUrl is optional)'
    });
  }

  // Default API URL if not provided
  const finalApiUrl = apiUrl || 'https://apisv2.windeal.co.ke/postdata';

  // Serve dynamic HTML page
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nafsi Identity Verification</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #0d153b 0%, #00b8ff 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    h1 {
      color: #0d153b;
      margin-bottom: 10px;
      font-size: 32px;
      text-align: center;
    }

    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 16px;
      text-align: center;
    }

    .button {
      background: linear-gradient(135deg, #00b8ff 0%, #0d153b 100%);
      color: white;
      border: none;
      padding: 16px 32px;
      font-size: 18px;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-bottom: 20px;
    }

    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 184, 255, 0.4);
    }

    .button:active {
      transform: translateY(0);
    }

    .info-box {
      background: #f5f5f5;
      border-left: 4px solid #00b8ff;
      padding: 16px;
      margin-bottom: 20px;
      border-radius: 4px;
    }

    .info-box strong {
      color: #0d153b;
    }

    .result {
      margin-top: 20px;
      padding: 20px;
      border-radius: 8px;
      display: none;
    }

    .result-success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    .result-error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .result h3 {
      margin-bottom: 10px;
    }

    pre {
      background: #fff;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }

    .version {
      text-align: center;
      color: #999;
      font-size: 14px;
      margin-top: 20px;
    }

    .config-display {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 12px;
      margin-bottom: 20px;
      border-radius: 4px;
      font-size: 13px;
    }

    .config-display code {
      color: #1565c0;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Nafsi Identity Verification</h1>
    <p class="subtitle">Secure ID and Selfie Verification</p>

    <div class="config-display">
      <strong>🔧 Configuration:</strong><br>
      Workflow ID: <code>${workflowId}</code><br>
      Client ID: <code>${clientId}</code><br>
      API URL: <code>${finalApiUrl}</code>
    </div>

    <div class="info-box">
      <strong>📝 How it works:</strong><br>
      1. Click "Start Verification" below<br>
      2. Allow camera access when prompted<br>
      3. Capture front and back of your ID<br>
      4. Take a selfie<br>
      5. Review and submit
    </div>

    <button class="button" onclick="startVerification()">
      🚀 Start Verification
    </button>

    <div id="result-success" class="result result-success">
      <h3>✅ Verification Successful!</h3>
      <pre id="result-data"></pre>
    </div>

    <div id="result-error" class="result result-error">
      <h3>❌ Verification Failed</h3>
      <pre id="error-data"></pre>
    </div>

    <div class="version">
      SDK Version: <span id="sdk-version">Loading...</span>
    </div>
  </div>

  <!-- Load the Nafsi SDK -->
  <script src="/v1/nafsi.js"></script>

  <script>
    // Configuration from query parameters
    const CONFIG = {
      workflowId: '${workflowId}',
      clientId: '${clientId}',
      apiUrl: '${finalApiUrl}'
    };

    // Display SDK version
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof Nafsi !== 'undefined') {
        document.getElementById('sdk-version').textContent = Nafsi.getVersion();
        console.log('✅ Nafsi SDK loaded successfully');
        console.log('📋 Configuration:', CONFIG);
      } else {
        console.error('❌ Nafsi SDK not loaded');
      }
    });

    function startVerification() {
      // Hide previous results
      document.getElementById('result-success').style.display = 'none';
      document.getElementById('result-error').style.display = 'none';

      try {
        console.log('🚀 Starting verification with config:', CONFIG);

        Nafsi.init({
          workflowId: CONFIG.workflowId,
          clientId: CONFIG.clientId,
          apiUrl: CONFIG.apiUrl,
          debug: true,

          onSuccess: function(result) {
            console.log('✅ Verification Success:', result);
            document.getElementById('result-data').textContent = JSON.stringify(result, null, 2);
            document.getElementById('result-success').style.display = 'block';
            document.getElementById('result-success').scrollIntoView({ behavior: 'smooth' });
          },

          onFailure: function(error) {
            console.error('❌ Verification Failed:', error);
            document.getElementById('error-data').textContent = JSON.stringify(error, null, 2);
            document.getElementById('result-error').style.display = 'block';
            document.getElementById('result-error').scrollIntoView({ behavior: 'smooth' });
          }
        });

        // Start the verification flow
        Nafsi.start();

      } catch (error) {
        console.error('❌ Error initializing Nafsi SDK:', error);
        document.getElementById('error-data').textContent = error.message || error;
        document.getElementById('result-error').style.display = 'block';
      }
    }
  </script>
</body>
</html>`);
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
      '/v1/verify?workflowId=xxx&clientId=yyy&apiUrl=zzz',
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
