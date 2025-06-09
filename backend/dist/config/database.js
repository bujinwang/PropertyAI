"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabaseConnections = exports.checkDatabaseConnections = exports.setupPostgreSQL = exports.setupMongoDB = exports.connectMongoDB = exports.prisma = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const dbManager_1 = __importStar(require("../utils/dbManager"));
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return dbManager_1.prisma; } });
const mongoManager_1 = __importDefault(require("../utils/mongoManager"));
const database_config_1 = require("./database.config");
const mongodb_config_1 = require("./mongodb.config");
dotenv.config();
// Prisma client is now imported from dbManager
// MongoDB connection function
const connectMongoDB = async () => {
    try {
        // Use the mongoManager to establish a connection with optimized settings
        await mongoManager_1.default.createMongoConnection();
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
exports.connectMongoDB = connectMongoDB;
// Function to set up and initialize MongoDB
const setupMongoDB = async () => {
    try {
        console.log('Setting up MongoDB...');
        // Verify database connection
        const isConnected = await mongoManager_1.default.checkConnectionHealth();
        if (!isConnected) {
            throw new Error('Failed to connect to MongoDB database');
        }
        // Initialize MongoDB with security settings and optimizations
        await mongoManager_1.default.initializeDatabase();
        // Set up scheduled database backups if enabled
        if (mongodb_config_1.mongoConfig.backup.enabled) {
            mongoManager_1.default.setupScheduledBackups();
        }
        // Monitor and log server status if in development mode
        if (process.env.NODE_ENV === 'development') {
            const serverStatus = await mongoManager_1.default.getServerStatus();
            console.log('MongoDB server version:', serverStatus.version);
            console.log('MongoDB storage engine:', serverStatus.storageEngine.name);
        }
        console.log('MongoDB setup completed successfully');
    }
    catch (error) {
        console.error('MongoDB setup failed:', error);
        throw error;
    }
};
exports.setupMongoDB = setupMongoDB;
// Function to set up and initialize PostgreSQL
const setupPostgreSQL = async () => {
    try {
        console.log('Setting up PostgreSQL...');
        // Verify database connection
        const isConnected = await dbManager_1.default.checkDatabaseHealth();
        if (!isConnected) {
            throw new Error('Failed to connect to PostgreSQL database');
        }
        // Apply security settings for PostgreSQL
        if (process.env.NODE_ENV === 'production') {
            await dbManager_1.default.applySecuritySettings();
        }
        // Initialize PostgreSQL with recommended settings
        await dbManager_1.default.initializeDatabase();
        // Set up scheduled database backups if enabled
        if (database_config_1.postgresConfig.backup.enabled) {
            dbManager_1.default.setupScheduledBackups();
        }
        // Perform database optimization if in production or explicitly requested
        if (process.env.NODE_ENV === 'production' || process.env.OPTIMIZE_DB === 'true') {
            await dbManager_1.default.optimizeDatabase();
        }
        console.log('PostgreSQL setup completed successfully');
    }
    catch (error) {
        console.error('PostgreSQL setup failed:', error);
        throw error;
    }
};
exports.setupPostgreSQL = setupPostgreSQL;
// Function to check database connections
const checkDatabaseConnections = async () => {
    const result = {
        mongodb: false,
        postgresql: false
    };
    try {
        // Check MongoDB connection via mongoManager
        result.mongodb = await mongoManager_1.default.checkConnectionHealth();
    }
    catch (error) {
        console.error('MongoDB connection check failed:', error);
    }
    try {
        // Check PostgreSQL connection via dbManager
        result.postgresql = await dbManager_1.default.checkDatabaseHealth();
    }
    catch (error) {
        console.error('PostgreSQL connection check failed:', error);
    }
    return result;
};
exports.checkDatabaseConnections = checkDatabaseConnections;
// Function to close database connections
const closeDatabaseConnections = async () => {
    try {
        await mongoose_1.default.disconnect();
        await dbManager_1.prisma.$disconnect();
        console.log('Database connections closed');
    }
    catch (error) {
        console.error('Error closing database connections:', error);
    }
};
exports.closeDatabaseConnections = closeDatabaseConnections;
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
//# sourceMappingURL=database.js.map