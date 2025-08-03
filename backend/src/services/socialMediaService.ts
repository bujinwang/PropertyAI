import { Rental } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import { PrismaClient } from '@prisma/client';
import { TwitterApi } from 'twitter-api-v2';

const prisma = new PrismaClient();

interface ISocialMediaPublisher {
  publish(rental: Rental, config: any, message: string): Promise<any>;
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

  async publish(rental: Rental, config: any, message: string) {
    const tweet = `${message}\n\n${rental.title}\n${rental.description}\n\nRent: $${rental.rent}`;
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

export const publishToSocialMedia = async (rentalId: string, platforms: string[], message: string) => {
  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental) {
    throw new AppError('Rental not found', 404);
  }

  const results: any = {};

  for (const platform of platforms) {
    try {
      const config = null; // Placeholder since SocialMediaPlatformConfig doesn't exist
      if (!config) {
        throw new AppError(`Platform not configured: ${platform}`, 400);
      }
      const adapter = getPlatformAdapter(platform, config);
      const result = await adapter.publish(rental, config, message);
      results[platform] = { success: true, data: result };
    } catch (error) {
      results[platform] = { success: false, error: (error as Error).message };
    }
  }

  return results;
};
