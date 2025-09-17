const { Sequelize } = require('sequelize');
const cacheService = require('../services/cacheService');
const performanceMonitor = require('../services/performanceMonitor');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'propertyai',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20,  // Increased from 5 to handle more concurrent connections
      min: 5,   // Maintain minimum connections to reduce connection overhead
      acquire: 60000,  // Increased timeout for complex queries
      idle: 20000,     // Increased idle time for connection reuse
      evict: 10000,    // Check for idle connections every 10 seconds
    },
    // Performance optimizations
    retry: {
      max: 3,  // Retry failed connections up to 3 times
    },
    dialectOptions: {
      // PostgreSQL specific optimizations
      statement_timeout: 60000,  // 60 second query timeout
      idle_in_transaction_session_timeout: 60000,  // Prevent idle transactions
    },
  }
);

// Initialize services
const initializeServices = async () => {
  try {
    await cacheService.initialize();
    console.log('✅ Cache service initialized successfully');

    await performanceMonitor.initialize();
    console.log('✅ Performance monitoring initialized successfully');
  } catch (error) {
    console.warn('Service initialization failed, continuing with reduced functionality:', error.message);
  }
};

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    await initializeServices();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

if (require.main === module) {
  testConnection();
}

module.exports = {
  sequelize,
  cacheService,
  performanceMonitor,
};