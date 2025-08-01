/// <reference types="long" />
require('dotenv').config(); // Load environment variables
import app from './app';
import http from 'http';
import { prisma, connectMongoDB, setupPostgreSQL, setupMongoDB, closeDatabaseConnections } from './config/database';
import WebSocketService from './services/webSocket.service';
import VoicemailService from './services/voicemailService';
import { rentCollectionService } from './services/rentCollection.service';
import { documentExpirationService } from './services/documentExpiration.service';
import './services/pubSub.service';
import path from 'path';

const PORT = process.env.PORT || 3001;

// Global server reference for graceful shutdown (moved to top)
let globalServer: http.Server | null = null;

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    console.log('Connected to MongoDB');
    
    // Set up MongoDB with security and performance settings
    await setupMongoDB();
    console.log('MongoDB setup and configuration completed');
    
    // Connect to PostgreSQL via Prisma
    await prisma.$connect();
    console.log('Connected to PostgreSQL via Prisma');
    
    // Set up PostgreSQL with security and performance settings
    await setupPostgreSQL();
    console.log('PostgreSQL setup and configuration completed');
    
    // Initialize Voicemail service
    new VoicemailService(path.join(__dirname, '../voicemails'));
    
    // Initialize Rent Collection service
    rentCollectionService.initialize();

    // Initialize Document Expiration service
    documentExpirationService.initialize();

    // Start the server with proper cleanup to prevent race conditions
    const startListening = (port: number) => {
      // Clean up any existing server instance
      if (globalServer) {
        globalServer.removeAllListeners();
        if (globalServer.listening) {
          globalServer.close();
        }
      }
      
      // Create a fresh server instance for each attempt
      const serverInstance = http.createServer(app);
      
      // Re-initialize WebSocket service with the new server instance
      new WebSocketService(serverInstance);
      
      const onError = (err: NodeJS.ErrnoException) => {
        // Remove listeners to prevent memory leaks
        serverInstance.removeAllListeners();
        
        if (err.code === 'EADDRINUSE' && process.env.NODE_ENV !== 'production') {
          console.log(`Port ${port} is busy, trying port ${port + 1}...`);
          // Use setTimeout to prevent stack overflow in rapid succession
          setTimeout(() => startListening(port + 1), 100);
        } else {
          console.error(`Failed to start server on port ${port}: ${err.message}`);
          process.exit(1);
        }
      };

      const onListening = () => {
        // Assign to global reference only on successful startup
        globalServer = serverInstance;
        console.log(`Server successfully started on port ${port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      };

      // Attach error listener BEFORE calling listen to prevent unhandled errors
      serverInstance.on('error', onError);
      serverInstance.once('listening', onListening);
      
      // Start listening
      serverInstance.listen(port);
    };

    startListening(Number(PORT));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  if (globalServer && globalServer.listening) {
    globalServer.close(() => {
      console.log('Server closed.');
    });
  }
  await closeDatabaseConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  if (globalServer && globalServer.listening) {
    globalServer.close(() => {
      console.log('Server closed.');
    });
  }
  await closeDatabaseConnections();
  process.exit(0);
});

// Start the server
startServer();
