import { Listing } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import { PrismaClient } from '@prisma/client';
import { TwitterApi } from 'twitter-api-v2';

const prisma = new PrismaClient();

interface ISocialMediaPublisher {
  publish(listing: Listing, config: any, message: string): Promise<any>;
}

class TwitterPublishingAdapter implements ISocialMediaPublisher {
  private client: TwitterApi;

  constructor(config: any) {
    this.client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.apiSecret, // Assuming apiSecret is the access token secret
    });
  }

  async publish(listing: Listing, config: any, message: string) {
    const tweet = `${message}\n\n${listing.title}\n${listing.description}\n\nRent: $${listing.rent}`; // Changed price to rent
    const { data: createdTweet } = await this.client.v2.tweet(tweet);
    return { success: true, url: `https://twitter.com/someuser/status/${createdTweet.id}` };
  }
}

const getPlatformAdapter = (platform: string, config: any): ISocialMediaPublisher => {
  switch (platform) {
    case 'twitter':
      return new TwitterPublishingAdapter(config);
    default:
      throw new AppError(`Platform not supported: ${platform}`, 400);
  }
};

export const publishToSocialMedia = async (listingId: string, platforms: string[], message: string) => {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  const results: any = {};

  for (const platform of platforms) {
    try {
      const config = null; // Placeholder since SocialMediaPlatformConfig doesn't exist
      if (!config) {
        throw new AppError(`Platform not configured: ${platform}`, 400);
      }
      const adapter = getPlatformAdapter(platform, config);
      const result = await adapter.publish(listing, config, message);
      results[platform] = { success: true, data: result };
    } catch (error) {
      results[platform] = { success: false, error: (error as Error).message };
    }
  }

  return results;
};
