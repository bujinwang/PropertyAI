import dotenv from 'dotenv';

// Initialize dotenv to load environment variables from .env file
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/propertyai',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'property-ai-images',
  },
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  geocodingCacheTime: parseInt(process.env.GEOCODING_CACHE_TIME || '86400000'), // Default: 24 hours in milliseconds
}; 