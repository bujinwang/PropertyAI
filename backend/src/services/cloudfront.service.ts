import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { storageService } from './storage.service';
import { awsConfig } from '../config/aws';

class CloudFrontService {
  private cloudFrontClient: CloudFrontClient;
  private distributionId: string;

  constructor() {
    this.cloudFrontClient = new CloudFrontClient({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });
    this.distributionId = awsConfig.s3.cloudFrontDistributionId || '';
  }

  /**
   * Invalidate CloudFront cache for specific files
   */
  async invalidateCache(paths: string[]): Promise<string> {
    if (!this.distributionId) {
      throw new Error('CloudFront distribution ID not configured');
    }

    const command = new CreateInvalidationCommand({
      DistributionId: this.distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
        CallerReference: `invalidation-${Date.now()}`,
      },
    });

    try {
      const response = await this.cloudFrontClient.send(command);
      return response.Invalidation?.Id || '';
    } catch (error) {
      console.error('CloudFront invalidation error:', error);
      throw new Error('Failed to invalidate CloudFront cache');
    }
  }

  /**
   * Invalidate entire folder
   */
  async invalidateFolder(folderPath: string): Promise<string> {
    return this.invalidateCache([`${folderPath}/*`]);
  }

  /**
   * Invalidate all files
   */
  async invalidateAll(): Promise<string> {
    return this.invalidateCache(['/*']);
  }

  /**
   * Get CDN URL for S3 key
   */
  getCDNUrl(key: string): string {
    const cloudFrontDomain = awsConfig.s3.cloudFrontDomain;
    if (!cloudFrontDomain) {
      return storageService.getPublicUrl(key);
    }
    return `https://${cloudFrontDomain}/${key}`;
  }

  /**
   * Check if CDN is configured
   */
  isCDNConfigured(): boolean {
    return !!awsConfig.s3.cloudFrontDomain;
  }
}

const cloudFrontService = new CloudFrontService();
export { cloudFrontService, CloudFrontService };