const dotenv = require('dotenv');
const path = require('path');

/**
 * Validates that essential environment variables are present and correctly formatted.
 * This runs before the application starts to prevent runtime crashes.
 */
const validateEnv = () => {
  const missing = [];
  
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'PORT'
  ];

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing essential environment variables:');
    console.error(`   ${missing.join(', ')}`);
    console.error('   Please check your backend/.env file.');
    process.exit(1);
  }

  // Specific validation for MONGO_URI
  if (!process.env.MONGO_URI.startsWith('mongodb')) {
    console.error('❌ CRITICAL ERROR: Invalid MONGO_URI format. Must start with "mongodb" or "mongodb+srv"');
    process.exit(1);
  }

  if (process.env.MONGO_URI.includes('<db_password>')) {
    console.error('❌ CRITICAL ERROR: MONGO_URI contains placeholder "<db_password>". Please replace it with your actual password.');
    process.exit(1);
  }

  console.log('✅ Environment Configuration Validated.');
};

module.exports = validateEnv;
