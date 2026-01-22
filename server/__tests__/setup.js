// Setup file untuk testing
// File ini akan dijalankan sebelum semua test

const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

// Mock environment variables untuk testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GEOAPIFY_API_KEY = 'test-geoapify-api-key';
process.env.GEMINI_API_KEY = 'test-gemini-api-key';

let sequelize;

// Setup database sebelum test dimulai
beforeAll(async () => {
  const testConfig = config.test;
  
  try {
    // Connect ke postgres database untuk create test database if not exists
    const pgSequelize = new Sequelize('postgres', testConfig.username, testConfig.password, {
      host: testConfig.host,
      dialect: testConfig.dialect,
      logging: false
    });

    // Try to create test database
    await pgSequelize.query(`CREATE DATABASE "${testConfig.database}"`).catch(() => {
      // Database mungkin sudah ada, ignore error
    });
    
    await pgSequelize.close();

    // Now connect to test database and sync
    const { sequelize: appSequelize } = require('../models');
    sequelize = appSequelize;
    
    // Sync database untuk test (force: true akan recreate tables)
    await sequelize.sync({ force: true });
    console.log('Test database synced successfully');
    
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
});

// Cleanup setelah semua test selesai
afterAll(async () => {
  if (sequelize) {
    await sequelize.close();
    console.log('Database connection closed');
  }
});

process.env.GEOAPIFY_API_KEY = 'test-geoapify-api-key';
process.env.GEMINI_API_KEY = 'test-gemini-api-key';
