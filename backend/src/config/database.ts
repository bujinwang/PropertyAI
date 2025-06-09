import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import dbManager, { prisma } from '../utils/dbManager';
export { prisma };
import mongoManager from '../utils/mongoManager';
import { postgresConfig, getDatabaseUrl } from './database.config';
import { mongoConfig } from './mongodb.config';

dotenv.config();

// Prisma client is now imported from dbManager

// MongoDB connection function
export const connectMongoDB = async (): Promise<void> => {
  try {
    // Use the mongoManager to establish a connection with optimized settings
    await mongoManager.createMongoConnection();
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to set up and initialize MongoDB
export const setupMongoDB = async (): Promise<void> => {
  try {
    console.log('Setting up MongoDB...');
    
    // Verify database connection
    const isConnected = await mongoManager.checkConnectionHealth();
    if (!isConnected) {
      throw new Error('Failed to connect to MongoDB database');
    }
    
    // Initialize MongoDB with security settings and optimizations
    await mongoManager.initializeDatabase();
    
    // Set up scheduled database backups if enabled
    if (mongoConfig.backup.enabled) {
      mongoManager.setupScheduledBackups();
    }
    
    // Monitor and log server status if in development mode
    if (process.env.NODE_ENV === 'development') {
      const serverStatus = await mongoManager.getServerStatus();
      console.log('MongoDB server version:', serverStatus.version);
      console.log('MongoDB storage engine:', serverStatus.storageEngine.name);
    }
    
    console.log('MongoDB setup completed successfully');
  } catch (error) {
    console.error('MongoDB setup failed:', error);
    throw error;
  }
};

// Function to set up and initialize PostgreSQL
export const setupPostgreSQL = async (): Promise<void> => {
  try {
    console.log('Setting up PostgreSQL...');
    
    // Verify database connection
    const isConnected = await dbManager.checkDatabaseHealth();
    if (!isConnected) {
      throw new Error('Failed to connect to PostgreSQL database');
    }
    
    // Apply security settings for PostgreSQL
    if (process.env.NODE_ENV === 'production') {
      await dbManager.applySecuritySettings();
    }
    
    // Initialize PostgreSQL with recommended settings
    await dbManager.initializeDatabase();
    
    // Set up scheduled database backups if enabled
    if (postgresConfig.backup.enabled) {
      dbManager.setupScheduledBackups();
    }
    
    // Perform database optimization if in production or explicitly requested
    if (process.env.NODE_ENV === 'production' || process.env.OPTIMIZE_DB === 'true') {
      await dbManager.optimizeDatabase();
    }
    
    console.log('PostgreSQL setup completed successfully');
  } catch (error) {
    console.error('PostgreSQL setup failed:', error);
    throw error;
  }
};

// Function to check database connections
export const checkDatabaseConnections = async (): Promise<{ mongodb: boolean; postgresql: boolean }> => {
  const result = {
    mongodb: false,
    postgresql: false
  };

  try {
    // Check MongoDB connection via mongoManager
    result.mongodb = await mongoManager.checkConnectionHealth();
  } catch (error) {
    console.error('MongoDB connection check failed:', error);
  }

  try {
    // Check PostgreSQL connection via dbManager
    result.postgresql = await dbManager.checkDatabaseHealth();
  } catch (error) {
    console.error('PostgreSQL connection check failed:', error);
  }

  return result;
};

// Function to close database connections
export const closeDatabaseConnections = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    await prisma.$disconnect();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
};

// Redis configuration (commented out for future implementation)
/*
import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
};
*/
