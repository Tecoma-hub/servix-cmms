// backend/middleware/cors.js
const cors = require('cors');

// Configure CORS options for local development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins for local development
    const allowedOrigins = [
      'http://localhost:3000', // Frontend development server
      'http://localhost:5000'  // Backend server (for direct browser access)
    ];
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);