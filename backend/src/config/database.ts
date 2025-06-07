import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Prisma client
export const prisma = new PrismaClient();

// MongoDB connection function
export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/propertyai';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to check database connections
export const checkDatabaseConnections = async (): Promise<{ mongodb: boolean; postgresql: boolean }> => {
  const result = {
    mongodb: false,
    postgresql: false
  };

  try {
    // Check MongoDB connection
    result.mongodb = mongoose.connection.readyState === 1;
  } catch (error) {
    console.error('MongoDB connection check failed:', error);
  }

  try {
    // Check PostgreSQL connection via Prisma
    await prisma.$queryRaw`SELECT 1`;
    result.postgresql = true;
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