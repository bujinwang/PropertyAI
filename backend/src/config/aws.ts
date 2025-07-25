import { S3Client, CloudFrontClient } from '@aws-sdk/client-s3';
import { CloudFrontClient as AWSCloudFrontClient } from '@aws-sdk/client-cloudfront';

export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  s3: {
    bucket: string;
    cloudFrontDomain?: string;
    cloudFrontDistributionId?: string;
  };
}

export const awsConfig: AWSConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION || 'us-east-1',
  s3: {
    bucket: process.env.AWS_S3_BUCKET_NAME!,
    cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
    cloudFrontDistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
  },
};

// Validate configuration
export const validateAWSConfig = () => {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing AWS configuration: ${missing.join(', ')}`);
  }

  return true;
};

// Initialize AWS clients
export const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  },
});

export const cloudFrontClient = new AWSCloudFrontClient({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  },
});

export default awsConfig;